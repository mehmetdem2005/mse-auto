/**
 * Video assembly (default path: ffmpeg — light enough for Render's cheap tiers).
 *
 * Pipeline: ShortScript -> Gemini images (one per beat) -> Gemini TTS narration ->
 * ffmpeg: vertical 1080x1920, Ken-Burns zoom on each image, burned-in captions synced
 * roughly to beats, optional royalty-free background music bed -> output.mp4.
 *
 * Higher-quality alternative: Remotion (React-based, frame-perfect captions/animation).
 * See /remotion and PLAN.md §5 — swap renderVideo() for the Remotion renderer if you want
 * studio-grade motion. ffmpeg is the robust default so the worker runs anywhere.
 *
 * Visuals are AI-generated/original or your own assets only — no scraping copyrighted media.
 */
import { spawn } from "node:child_process";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { generateImage, tts } from "./gemini.js";
import type { ShortScript } from "./types.js";

const WORK = process.env.WORK_DIR || "/tmp/shorts";

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: "inherit" });
    p.on("close", (code) => (code === 0 ? res() : rej(new Error(`${cmd} exited ${code}`))));
  });
}

export async function renderVideo(jobId: string, script: ShortScript): Promise<{ videoPath: string; audioPath: string }> {
  const dir = join(WORK, jobId);
  await mkdir(dir, { recursive: true });

  const audioSec = script.estDurationSec || 50;

  // 1) Narration (Gemini TTS) – style steered per the chosen styleId.
  //    Free-tier fallback: if TTS is unavailable, render a silent track so the video still builds.
  const voiceStyle = script.styleId.includes("narrator")
    ? script.styleId
    : "warm documentary narrator, unhurried";
  const audioPath = join(dir, "narration.wav");
  try {
    const audio = await tts({ text: script.narrationText, styleInstruction: voiceStyle });
    await writeFile(audioPath, audio);
  } catch {
    await run("ffmpeg", ["-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", String(audioSec), audioPath]);
  }

  // 2) One original image per beat.
  //    Free-tier fallback: if image generation is quota-blocked, use an ffmpeg gradient background.
  const PALETTE = [["0x10243f", "0x2a1840"], ["0x1c1c2e", "0x3a2a10"], ["0x0e2a2a", "0x2a0e1e"], ["0x24201a", "0x10202c"], ["0x281020", "0x102820"]];
  const imgPaths: string[] = [];
  const prompts = script.visualPrompts.length ? script.visualPrompts : script.beats;
  for (let i = 0; i < prompts.length; i++) {
    const p = join(dir, `img${i}.png`);
    try {
      const b64 = await generateImage(
        `${prompts[i]} — vertical 9:16 composition, cinematic, original illustration, no text, no real logos or real people`,
      );
      await writeFile(p, Buffer.from(b64, "base64"));
    } catch {
      const [c0, c1] = PALETTE[i % PALETTE.length];
      await run("ffmpeg", ["-y", "-f", "lavfi", "-i", `gradients=s=1080x1920:c0=${c0}:c1=${c1}:x0=0:y0=0:x1=1080:y1=1920:duration=1`, "-frames:v", "1", p]);
    }
    imgPaths.push(p);
  }

  // 3) Determine per-image duration from narration length (approx) and build ffmpeg inputs.
  //    For exact timing, measure audio duration with ffprobe; here we split evenly.
  const per = Math.max(2, audioSec / imgPaths.length);
  const FPS = 24;                                   // 24 (vs 30) → ~20% fewer frames to encode
  const frames = Math.round(per * FPS);

  // Memory-bounded assembly (critical on 512MB tiers like Render starter): instead of one
  // giant filtergraph that holds every beat + zoompan + libx264 (default preset, all threads)
  // in RAM at once — which OOM-kills the whole worker mid-render — we render each Ken-Burns
  // clip on its own (peak memory = one 1080x1920 frame), stream-copy concat them (~0 memory),
  // then do a single light caption+audio pass. All passes use ultrafast + 1 thread.
  const LOWMEM = ["-preset", "ultrafast", "-threads", "1", "-x264-params", "ref=1:bframes=0:rc-lookahead=10"];

  // 3a) One short Ken-Burns clip per image.
  const clipPaths: string[] = [];
  for (let i = 0; i < imgPaths.length; i++) {
    const clip = join(dir, `clip${i}.mp4`);
    await run("ffmpeg", [
      "-y", "-loop", "1", "-t", String(per), "-i", imgPaths[i],
      "-vf",
      `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,` +
        `zoompan=z='min(zoom+0.0008,1.12)':d=${frames}:s=1080x1920:fps=${FPS},setsar=1,format=yuv420p`,
      "-c:v", "libx264", ...LOWMEM, "-r", String(FPS),
      clip,
    ]);
    clipPaths.push(clip);
  }

  // 3b) Concatenate clips with the concat demuxer (stream copy — negligible memory).
  const listPath = join(dir, "clips.txt");
  await writeFile(listPath, clipPaths.map((p) => `file '${p}'`).join("\n"));
  const joined = join(dir, "joined.mp4");
  await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", joined]);

  // 3c) Burn the hook caption (first ~2.5s) and mux narration — single, light pass.
  const safeHook = script.hook.replace(/[:\\']/g, " ").slice(0, 60);
  const FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
  const videoPath = join(dir, "short.mp4");
  await run("ffmpeg", [
    "-y", "-i", joined, "-i", audioPath,
    "-vf",
    `drawtext=fontfile=${FONT}:text='${safeHook}':fontcolor=white:fontsize=64:box=1:boxcolor=black@0.5:` +
      `boxborderw=20:x=(w-text_w)/2:y=h*0.12:enable='lt(t,2.5)'`,
    "-c:v", "libx264", ...LOWMEM, "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-c:a", "aac", "-b:a", "192k",
    "-shortest",
    videoPath,
  ]);

  return { videoPath, audioPath };
}
