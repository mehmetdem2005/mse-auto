import { NextResponse } from "next/server";
export const runtime = "nodejs";

// Speech-to-text via OpenAI gpt-4o-mini-transcribe (NOT Google). Far fewer Turkish hallucinations.
// Includes a command-vocabulary prompt + aggressive hallucination filter.
const KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.STT_MODEL || "gpt-4o-mini-transcribe";
const PROMPT = "ShortsPilot komut merkezi. Olası komutlar: kuyruğu göster, analizi aç, durum, bilgi tabanı, hafıza, ajanlar, yeni taslak üret, sorunları çöz, onayla, reddet, konu ekle.";

// Whisper/gpt-4o hallucinations on silence/background — drop these.
// These patterns appear when there's no real speech (room noise, background TV, etc.)
const JUNK = [
  /alt[ıi]?yaz[ıi]/i,          // "Altyazı M.K." subtitle watermark
  /abone ol/i,                   // subscribe hallucination
  /te[şs]ekk[üu]rler/i,         // thanks hallucination
  /izledi[ğg]iniz için/i,       // "for watching" hallucination
  /görü[şs][üu]r[üu]z/i,       // "see you" hallucination
  /^\.+$/, /^\s*$/,             // dots/empty
  /^m\.?k\.?$/i,               // just "M.K."
  /^www\./i,                    // URL hallucination
  /^https?:\/\//i,             // URL hallucination
  /copyright/i,                  // copyright notice
  /\[müzik\]/i, /\[music\]/i,  // music label
  /çeviri:/i, /translation:/i,  // translation label
  /subtitle by/i,               // subtitle by
  /^[\W\s]+$/,                  // only non-word chars
];

const isJunk = (text: string) => text.length < 3 || JUNK.some((re) => re.test(text));

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
    if (isJunk(text)) text = "";
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ text: "", error: String(e?.message || e).slice(0, 120) }, { status: 500 });
  }
}
