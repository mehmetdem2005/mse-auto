import { NextResponse } from "next/server";
export const runtime = "nodejs";

// Premium assistant voice — OpenAI TTS (tts-1-hd, "onyx" = deep JARVIS-style). Not Google TTS.
const KEY = process.env.OPENAI_API_KEY;
const VOICE = process.env.ASSISTANT_VOICE || "onyx";
const MODEL = process.env.OPENAI_TTS_MODEL || "tts-1-hd";

export async function POST(req: Request) {
  if (!KEY) return new NextResponse("OPENAI_API_KEY yok", { status: 500 });
  const { text } = await req.json().catch(() => ({ text: "" }));
  if (!text || typeof text !== "string") return new NextResponse("metin yok", { status: 400 });
  const r = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, voice: VOICE, input: text.slice(0, 1200), response_format: "mp3" }),
  });
  if (!r.ok) return new NextResponse(`TTS hata: ${r.status}`, { status: 502 });
  const buf = Buffer.from(await r.arrayBuffer());
  return new NextResponse(buf, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
}
