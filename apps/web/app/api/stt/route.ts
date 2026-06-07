import { NextResponse } from "next/server";
export const runtime = "nodejs";

// Speech-to-text via OpenAI gpt-4o-mini-transcribe (NOT Google). Far fewer Turkish hallucinations
// than whisper-1. Includes a command-vocabulary prompt + a hallucination filter.
const KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.STT_MODEL || "gpt-4o-mini-transcribe";
const PROMPT = "ShortsPilot komut merkezi. Olası komutlar: kuyruğu göster, analizi aç, durum, bilgi tabanı, hafıza, ajanlar, yeni taslak üret, sorunları çöz, onayla, reddet.";
// Whisper/Turkish hallucinations on silence (subtitle credits, sub-CTAs) — drop these.
const JUNK = [/^alt[ıi]?yaz[ıi]/i, /abone ol/i, /^te[şs]ekk[üu]rler/i, /izlediğiniz için/i, /^\.?$/, /^m\.?k\.?$/i, /altyazı m\.?k\.?/i];

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
    form.append("prompt", PROMPT);
    form.append("temperature", "0");
    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST", headers: { Authorization: `Bearer ${KEY}` }, body: form,
    });
    if (!r.ok) return NextResponse.json({ text: "", error: `STT ${r.status}` }, { status: 502 });
    const d = await r.json();
    let text = (d.text || "").trim();
    if (text.length < 2 || JUNK.some((re) => re.test(text))) text = "";  // drop hallucinations/noise
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ text: "", error: String(e?.message || e).slice(0, 120) }, { status: 500 });
  }
}
