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

  // 1) Narration (Gemini TTS) – style steered per the chosen styleId.
  const voiceStyle = script.styleId.includes("narrator")
    ? script.styleId
    : "warm documentary narrator, unhurried";
  const audio = await tts({ text: script.narrationText, styleInstruction: voiceStyle });
  const audioPath = join(dir, "narration.wav");
  await writeFile(audioPath, audio);

  // 2) One original image per beat.
  const imgPaths: string[] = [];
  const prompts = script.visualPrompts.length ? script.visualPrompts : script.beats;
  for (let i = 0; i < prompts.length; i++) {
    const b64 = await generateImage(
      `${prompts[i]} — vertical 9:16 composition, cinematic, original illustration, no text, no real logos or real people`,
    );
    const p = join(dir, `img${i}.png`);
    await writeFile(p, Buffer.from(b64, "base64"));
    imgPaths.push(p);
  }

  // 3) Determine per-image duration from narration length (approx) and build ffmpeg inputs.
  //    For exact timing, measure audio duration with ffprobe; here we split evenly.
  const audioSec = script.estDurationSec || 50;
  const per = Math.max(2, audioSec / imgPaths.length);

  // Build a concat of Ken-Burns clips, then overlay captions, then mux audio.
  // (Kept as a single filtergraph for portability; tune in PLAN.md §5.)
  const inputs: string[] = [];
  imgPaths.forEach((p) => inputs.push("-loop", "1", "-t", String(per), "-i", p));
  inputs.push("-i", audioPath);

  const segments = imgPaths
    .map(
      (_, i) =>
        `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,` +
        `zoompan=z='min(zoom+0.0008,1.12)':d=${Math.round(per * 25)}:s=1080x1920,setsar=1[v${i}]`,
    )
    .join(";");
  const concat = imgPaths.map((_, i) => `[v${i}]`).join("") + `concat=n=${imgPaths.length}:v=1:a=0[vid]`;

  // Caption: show the hook for the first ~2.5s, then on-screen lines. Simplest robust
  // approach = a drawtext for the hook; full per-beat subtitling lives in the Remotion path.
  const safeHook = script.hook.replace(/[:\\']/g, " ").slice(0, 60);
  const caption =
    `[vid]drawtext=text='${safeHook}':fontcolor=white:fontsize=64:box=1:boxcolor=black@0.5:` +
    `boxborderw=20:x=(w-text_w)/2:y=h*0.12:enable='lt(t,2.5)'[out]`;

  const videoPath = join(dir, "short.mp4");
  await run("ffmpeg", [
    "-y",
    ...inputs,
    "-filter_complex", `${segments};${concat};${caption}`,
    "-map", "[out]",
    "-map", `${imgPaths.length}:a`,
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30",
    "-c:a", "aac", "-b:a", "192k",
    "-shortest",
    videoPath,
  ]);

  return { videoPath, audioPath };
}
