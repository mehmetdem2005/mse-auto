/**
 * Video assembly (default path: ffmpeg — light enough for Render's cheap tiers).
 *
 * Sentence-driven pipeline: the narration is split into SENTENCES; for EACH sentence we
 * generate one semantically-matching image (Vertex AI, each referencing the previous image
 * for a consistent visual story). Each image is shown for exactly its sentence's spoken
 * duration, and the burned-in subtitle is that same sentence — so image + caption change
 * together, perfectly in sync. A persistent title banner sits up top.
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

/** Measure media duration in seconds with ffprobe (so visuals/captions sync to the real audio). */
function probeDuration(path: string): Promise<number> {
  return new Promise((res) => {
    let out = "";
    const p = spawn("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path]);
    p.stdout.on("data", (d) => (out += d.toString()));
    p.on("close", () => res(parseFloat(out.trim()) || 0));
    p.on("error", () => res(0));
  });
}

interface Cue { start: number; end: number; text: string }

/** Split narration into one cue PER SENTENCE, timed by length over the real audio duration.
 *  Each cue becomes one image + one subtitle, so visuals change sentence-by-sentence. */
function buildCues(text: string, dur: number): Cue[] {
  const sentences = text.replace(/\s+/g, " ").trim().split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean);
  if (!sentences.length) return [];
  const totalChars = sentences.reduce((a, s) => a + s.length, 0) || 1;
  const cues: Cue[] = [];
  let t = 0;
  for (const s of sentences) {
    const d = Math.max(1.2, (dur * s.length) / totalChars);
    cues.push({ start: t, end: Math.min(dur, t + d), text: s });
    t += d;
  }
  cues[cues.length - 1].end = dur;
  return cues;
}

// ── Subtitles (ASS): word-wrapped, boxed, one cue per sentence ────────────────
function assTime(s: number): string {
  s = Math.max(0, s);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${sec.toFixed(2).padStart(5, "0")}`;
}
const assEsc = (t: string) => t.replace(/\r?\n/g, " ").replace(/\{/g, "(").replace(/\}/g, ")").trim();

/** Top title banner + bottom word-wrapped captions. Colours are &HAABBGGRR; BorderStyle 3 =
 *  opaque box (BackColour) so text never gets lost over busy imagery. */
function buildAss(title: string, cues: Cue[], total: number): string {
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
  const voiceStyle = script.styleId.includes("narrator") ? script.styleId : "warm documentary narrator, unhurried";
  let audioPath = join(dir, "narration.mp3");
  try {
    const audio = await tts({ text: script.narrationText, styleInstruction: voiceStyle });
    await writeFile(audioPath, audio);
  } catch {
    audioPath = join(dir, "silent.wav");
    await run("ffmpeg", ["-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", String(estSec), audioPath]);
  }

  // Real narration length drives both per-sentence image timing and caption sync.
  const audioSec = (await probeDuration(audioPath)) || estSec;

  // 2) One semantic image PER SENTENCE. Each call is independent (no context limit), but the
  //    PREVIOUS image is fed back as a reference so characters / style / palette / world stay
  //    consistent and the story visually continues sentence-by-sentence. No image-count cap.
  const cues = buildCues(script.narrationText || script.beats.join(". "), audioSec);
  const PALETTE = [["0x10243f", "0x2a1840"], ["0x1c1c2e", "0x3a2a10"], ["0x0e2a2a", "0x2a0e1e"], ["0x24201a", "0x10202c"], ["0x281020", "0x102820"]];
  const imgPaths: string[] = [];
  let prevB64: string | undefined;
  for (let i = 0; i < cues.length; i++) {
    const p = join(dir, `img${i}.png`);
    const line = cues[i].text;
    const prompt = i === 0
      ? `Establish the visual world for a vertical 9:16 short video. Illustrate the meaning of this narration line: "${line}". Cinematic, original illustration, rich consistent color palette and lighting. No text, no captions, no watermark, no real logos or real people.`
      : `Continue the SAME visual story — keep the exact same characters, art style, color palette, lighting and world as the reference image. Illustrate the meaning of the next narration line: "${line}". Vertical 9:16, cinematic. No text, no captions, no watermark.`;
    try {
      const b64 = await generateImage(prompt, prevB64);
      await writeFile(p, Buffer.from(b64, "base64"));
      prevB64 = b64; // carry the look forward to the next sentence
    } catch {
      const [c0, c1] = PALETTE[i % PALETTE.length];
      await run("ffmpeg", ["-y", "-f", "lavfi", "-i", `gradients=s=1080x1920:c0=${c0}:c1=${c1}:x0=0:y0=0:x1=1080:y1=1920:duration=1`, "-frames:v", "1", p]);
    }
    imgPaths.push(p);
  }

  const FPS = 24;
  // Memory-bounded assembly (critical on 512MB tiers): render each Ken-Burns clip alone, stream-copy
  // concat them, then a single light caption+audio pass. All passes use ultrafast + 1 thread.
  const LOWMEM = ["-preset", "ultrafast", "-threads", "1", "-x264-params", "ref=1:bframes=0:rc-lookahead=10"];

  // 3a) One Ken-Burns clip per sentence — duration = that sentence's spoken length (image↔caption sync).
  //     Single input frame + -frames:v avoids zoompan's frame-count explosion.
  const clipPaths: string[] = [];
  for (let i = 0; i < imgPaths.length; i++) {
    const per = Math.max(1.2, cues[i].end - cues[i].start);
    const frames = Math.max(2, Math.round(per * FPS));
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

  // 3c) Burn TITLE + per-sentence SUBTITLES (ASS) and mux narration.
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
