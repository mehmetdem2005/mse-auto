/**
 * Video assembly (default path: ffmpeg — light enough for Render's cheap tiers).
 *
 * Pipeline: ShortScript -> per-beat images (Vertex AI, each beat referencing the previous
 * image for a consistent visual story) -> Cloud TTS narration -> ffmpeg: vertical 1080x1920,
 * Ken-Burns zoom per image, burned-in TITLE (top banner) + word-wrapped SUBTITLES (bottom,
 * timed to the real narration length so nothing runs off-screen) -> output.mp4.
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

/** Measure media duration in seconds with ffprobe (so captions sync to the real audio). */
function probeDuration(path: string): Promise<number> {
  return new Promise((res) => {
    let out = "";
    const p = spawn("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path]);
    p.stdout.on("data", (d) => (out += d.toString()));
    p.on("close", () => res(parseFloat(out.trim()) || 0));
    p.on("error", () => res(0));
  });
}

// ── Subtitles (ASS): word-wrapped, boxed, timed to narration ──────────────────
function assTime(s: number): string {
  s = Math.max(0, s);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${sec.toFixed(2).padStart(5, "0")}`;
}
const assEsc = (t: string) => t.replace(/\r?\n/g, " ").replace(/\{/g, "(").replace(/\}/g, ")").trim();

/** Split narration into short, screen-safe caption cues, weighted by length over the real duration. */
function buildCues(text: string, dur: number): { start: number; end: number; text: string }[] {
  const sentences = text.replace(/\s+/g, " ").trim().split(/(?<=[.!?…])\s+/).filter(Boolean);
  const MAX = 84; // ~2 lines at fontsize 60 on a 1080-wide frame
  const chunks: string[] = [];
  for (const s of sentences) {
    if (s.length <= MAX) { chunks.push(s); continue; }
    let cur = "";
    for (const w of s.split(" ")) {
      if ((cur + " " + w).trim().length > MAX) { if (cur) chunks.push(cur.trim()); cur = w; }
      else cur += " " + w;
    }
    if (cur.trim()) chunks.push(cur.trim());
  }
  if (!chunks.length) return [];
  const totalChars = chunks.reduce((a, c) => a + c.length, 0) || 1;
  const cues: { start: number; end: number; text: string }[] = [];
  let t = 0;
  for (const c of chunks) {
    const d = Math.max(1.0, (dur * c.length) / totalChars);
    cues.push({ start: t, end: Math.min(dur, t + d), text: c });
    t += d;
  }
  cues[cues.length - 1].end = dur;
  return cues;
}

/** Build an ASS subtitle file: persistent top title banner + bottom word-wrapped captions.
 *  Colours are &HAABBGGRR. BorderStyle 3 = opaque box (BackColour) so text never gets lost. */
function buildAss(title: string, cues: { start: number; end: number; text: string }[], total: number): string {
  const header =
`[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Title,DejaVu Sans,56,&H00FFFFFF,&H000000FF,&H00000000,&HA0000000,1,0,0,0,100,100,0,0,3,4,0,8,70,70,110,1
Style: Sub,DejaVu Sans,62,&H0000FFFF,&H000000FF,&H00000000,&HB4000000,1,0,0,0,100,100,0,0,3,6,2,2,90,90,300,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  const lines: string[] = [];
  if (title) lines.push(`Dialogue: 0,${assTime(0)},${assTime(total)},Title,,0,0,0,,${assEsc(title)}`);
  for (const c of cues) lines.push(`Dialogue: 0,${assTime(c.start)},${assTime(c.end)},Sub,,0,0,0,,${assEsc(c.text)}`);
  return header + lines.join("\n") + "\n";
}

export async function renderVideo(jobId: string, script: ShortScript): Promise<{ videoPath: string; audioPath: string }> {
  const dir = join(WORK, jobId);
  await mkdir(dir, { recursive: true });

  const estSec = script.estDurationSec || 50;

  // 1) Narration (Cloud TTS Chirp 3 HD via Vertex; OpenAI/Gemini fallback).
  //    Free-tier fallback: if TTS is unavailable, render a silent track so the video still builds.
  const voiceStyle = script.styleId.includes("narrator") ? script.styleId : "warm documentary narrator, unhurried";
  let audioPath = join(dir, "narration.mp3");
  try {
    const audio = await tts({ text: script.narrationText, styleInstruction: voiceStyle });
    await writeFile(audioPath, audio);
  } catch {
    audioPath = join(dir, "silent.wav");
    await run("ffmpeg", ["-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", String(estSec), audioPath]);
  }

  // Real narration length drives both per-image timing and caption sync.
  const audioSec = (await probeDuration(audioPath)) || estSec;

  // 2) One original image per beat. Each call is independent (no context limit), but we pass the
  //    PREVIOUS image back in as a reference so characters / style / palette / world stay consistent
  //    and the story visually continues beat-to-beat.
  const PALETTE = [["0x10243f", "0x2a1840"], ["0x1c1c2e", "0x3a2a10"], ["0x0e2a2a", "0x2a0e1e"], ["0x24201a", "0x10202c"], ["0x281020", "0x102820"]];
  const imgPaths: string[] = [];
  // Cap beats: each Nano Banana Pro image is sequential (ref-chained) & slow, so bound render time.
  const MAX_IMG = Number(process.env.MAX_BEATS || 5);
  const prompts = (script.visualPrompts.length ? script.visualPrompts : script.beats).slice(0, MAX_IMG);
  let prevB64: string | undefined;
  for (let i = 0; i < prompts.length; i++) {
    const p = join(dir, `img${i}.png`);
    const prompt = i === 0
      ? `Establish the visual world for a vertical 9:16 short video. Scene: ${prompts[i]}. Cinematic, original illustration, rich consistent color palette and lighting. No text, no captions, no watermark, no real logos or real people.`
      : `Continue the SAME visual story — keep the exact same characters, art style, color palette, lighting and world as the reference image. Next moment in the narrative: ${prompts[i]}. Vertical 9:16, cinematic. No text, no captions, no watermark.`;
    try {
      const b64 = await generateImage(prompt, prevB64);
      await writeFile(p, Buffer.from(b64, "base64"));
      prevB64 = b64; // carry the look forward to the next beat
    } catch {
      const [c0, c1] = PALETTE[i % PALETTE.length];
      await run("ffmpeg", ["-y", "-f", "lavfi", "-i", `gradients=s=1080x1920:c0=${c0}:c1=${c1}:x0=0:y0=0:x1=1080:y1=1920:duration=1`, "-frames:v", "1", p]);
    }
    imgPaths.push(p);
  }

  // 3) Per-image duration from the real narration length.
  const per = Math.max(2, audioSec / imgPaths.length);
  const FPS = 24;
  const frames = Math.round(per * FPS);

  // Memory-bounded assembly (critical on 512MB tiers): render each Ken-Burns clip alone, stream-copy
  // concat them, then a single light caption+audio pass. All passes use ultrafast + 1 thread.
  const LOWMEM = ["-preset", "ultrafast", "-threads", "1", "-x264-params", "ref=1:bframes=0:rc-lookahead=10"];

  // 3a) One short Ken-Burns clip per image (single input frame + -frames:v to avoid frame explosion).
  const clipPaths: string[] = [];
  for (let i = 0; i < imgPaths.length; i++) {
    const clip = join(dir, `clip${i}.mp4`);
    await run("ffmpeg", [
      "-y", "-loop", "1", "-i", imgPaths[i],
      "-vf",
      `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,` +
        `zoompan=z='min(zoom+0.0008,1.12)':d=${frames}:s=1080x1920:fps=${FPS},setsar=1,format=yuv420p`,
      "-frames:v", String(frames),
      "-c:v", "libx264", ...LOWMEM, "-r", String(FPS),
      clip,
    ]);
    clipPaths.push(clip);
  }

  // 3b) Concatenate clips (stream copy — negligible memory).
  const listPath = join(dir, "clips.txt");
  await writeFile(listPath, clipPaths.map((p) => `file '${p}'`).join("\n"));
  const joined = join(dir, "joined.mp4");
  await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", joined]);

  // 3c) Burn TITLE + SUBTITLES (ASS, word-wrapped & boxed so nothing overflows) and mux narration.
  const cues = buildCues(script.narrationText || script.beats.join(". "), audioSec);
  const title = (script.title || script.hook || "").slice(0, 90);
  const assPath = join(dir, "subs.ass");
  await writeFile(assPath, buildAss(title, cues, audioSec));
  const videoPath = join(dir, "short.mp4");
  await run("ffmpeg", [
    "-y", "-i", joined, "-i", audioPath,
    "-vf", `ass=${assPath}`,
    "-c:v", "libx264", ...LOWMEM, "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-c:a", "aac", "-b:a", "192k",
    "-shortest",
    videoPath,
  ]);

  return { videoPath, audioPath };
}
