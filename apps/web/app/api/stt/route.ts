import { NextResponse } from "next/server";
export const runtime = "nodejs";

// Speech-to-text via OpenAI Whisper (NOT Google). Client posts an audio blob; we transcribe (tr).
const KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.STT_MODEL || "whisper-1";

export async function POST(req: Request) {
  if (!KEY) return NextResponse.json({ text: "", error: "OPENAI_API_KEY yok" }, { status: 500 });
  try {
    const inForm = await req.formData();
    const file = inForm.get("file") as File | null;
    if (!file) return NextResponse.json({ text: "" });
    const form = new FormData();
    form.append("file", file, "audio.webm");
    form.append("model", MODEL);
    form.append("language", "tr");
    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}` },
      body: form,
    });
    if (!r.ok) return NextResponse.json({ text: "", error: `STT ${r.status}` }, { status: 502 });
    const d = await r.json();
    return NextResponse.json({ text: (d.text || "").trim() });
  } catch (e: any) {
    return NextResponse.json({ text: "", error: String(e?.message || e).slice(0, 120) }, { status: 500 });
  }
}
