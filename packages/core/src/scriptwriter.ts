/**
 * Scriptwriter – produces a high-quality, ORIGINAL, fact-grounded Short script.
 *
 * Quality + survival design (see PLAN.md §3 and §11):
 *  - Pulls verified source material from the RAG store (real facts, not hallucinations).
 *  - Optionally grounds with Google Search for fresh/extra detail (with citations).
 *  - Adds an ORIGINAL commentary layer (your unique angle) – this is the single most
 *    important thing for surviving YouTube's 2026 inauthentic-content policy, which
 *    terminates channels that merely "read" facts with no human/editorial fingerprint.
 *  - Writes for retention: hard hook, short beats, a payoff, a CTA.
 *  - Returns strict JSON (ShortScript) so the rest of the pipeline is deterministic.
 *
 * The output is then sent to the HUMAN-IN-THE-LOOP review gate. You tweak the angle,
 * fix anything, approve. Automation does the grind; you keep the editorial voice.
 */
import { generate, SHORT_SCRIPT_SCHEMA, type GenUsage } from "./gemini.js";
import { getActivePrompt } from "./promptlab.js";
import { retrieve } from "./rag.js";
import { recall } from "./memory.js";
import type { ShortScript } from "./types.js";

const SYSTEM = (lang: string) => `Sen viral YouTube Shorts yazan usta bir senaristsin. Dil: ${lang}.
Az bilinen GERÇEK olayları, MAKSİMUM dikkat tutacak şekilde, hızlı ve kancalı anlatırsın.

KURALLAR:
1) GERÇEK kal: yalnızca verilen doğrulanmış kaynak materyali kullan. Uydurma YOK; emin değilsen o detayı at.
2) HOOK (ilk cümle, ~1.5 sn): bir tokat gibi olmalı — şok eden tek bir cümle ya da cevabı sona saklayan
   bir merak sorusu. Selam/giriş/bağlam cümlesi YOK. ("Bu adam...", "Kimse bilmiyor ama...", "Tarihin en tuhaf...").
3) RİTİM: ÇOK kısa cümleler. Her cümle yeni bir bilgi veya görsel getirsin. Dolgu/boşluk yok. Hızlı tempo, 6-10 cümle.
4) MERAK DÖNGÜSÜ: "ama", "tam o sırada", "işte o an" ile gerilimi taşı; asıl patlamayı (payoff) SONA sakla.
5) FELSEFE/ÖĞÜT YASAK: soyut "şundan dolayı önemli" analizleri, ahlak dersi, genel-geçer laf YOK.
   Somut, olgu ve görsel odaklı kal. En fazla SON cümle çarpıcı tek bir kapanış vuruşu olabilir.
6) CTA: tek kısa cümle (örn. "Daha fazlası için takip et.").
7) narrationText: hook + beats + payoff + kapanış AKICI tek seslendirme metni; 30-45 saniye (Shorts), asla aşma.
8) visualPrompts: cümle başına SOMUT, telifsiz sahne tarifleri (gerçek kişi/marka/telifli karakter taklidi yok).
9) description'a kısa AI ifşası ekle (örn. "Bu video AI araçlarıyla üretilmiştir.").

Çıktıyı SADECE şu JSON şemasıyla ver (markdown yok):
{
 "hook": "", "beats": ["",""], "payoff": "", "cta": "",
 "commentary": "", "onScreenText": ["",""], "visualPrompts": ["",""],
 "title": "", "description": "", "tags": ["",""],
 "sources": [{"title":"","url":""}],
 "narrationText": "", "estDurationSec": 40, "language": "${lang}", "styleId": ""
}`;

/** Function the model can call to record which topic it committed to (prevents repeats). */
const functions = [
  {
    name: "claim_topic",
    description: "Record the exact topic/event this script is about so it is never reused.",
    parameters: {
      type: "object",
      properties: { topic: { type: "string" } },
      required: ["topic"],
    },
  },
];

export async function writeScript(opts: {
  topic: string;
  language?: string;
  styleId: string;     // chosen by compliance.ts to vary format/voice/visuals
  useSearch?: boolean; // ground with Google Search for extra/fresh detail
}): Promise<{ script: ShortScript; usage: GenUsage }> {
  const lang = opts.language || "tr";

  // 1) Gather grounded, verified material + your remembered preferences/insights.
  const [chunks, prefs] = await Promise.all([
    retrieve(opts.topic, 6),
    recall(`${opts.topic} preferences style`, 6),
  ]);

  const sourceBlock = chunks
    .map((c, i) => `[${i + 1}] ${c.topic} (kaynak: ${c.source_title} – ${c.source_url})\n${c.text}`)
    .join("\n\n");
  const prefBlock = prefs.map((p) => `- ${p.content}`).join("\n");

  const prompt = `KONU: ${opts.topic}
STİL ID: ${opts.styleId}

DOĞRULANMIŞ KAYNAK MATERYAL:
${sourceBlock || "(yok – yalnızca grounding sonuçlarına güven)"}

HATIRLANAN TERCİHLER/İÇGÖRÜLER:
${prefBlock || "(yok)"}

Yukarıdaki materyale sadık kalarak, retention odaklı ve ÖZGÜN yorum içeren bir Shorts senaryosu yaz.`;

  // Guaranteed structured output (schema) + search grounding. We omit function-calling here
  // because forcing a response schema and tool-calling can conflict; the topic is recorded
  // in code by the runner. The regex fallback below covers any edge case.
  const res = await generate({
    model: process.env.GEMINI_REASONING_MODEL, // strongest model for script quality
    system: await getActivePrompt("scriptwriter", SYSTEM(lang)),
    prompt,
    search: opts.useSearch,
    responseSchema: SHORT_SCRIPT_SCHEMA,
    thinkingLevel: "high",
  });

  let parsed: ShortScript;
  try {
    parsed = JSON.parse(res.text);
  } catch {
    const m = res.text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Scriptwriter did not return JSON:\n" + res.text);
    parsed = JSON.parse(m[0]);
  }
  parsed.styleId = opts.styleId;
  parsed.language = lang;
  return { script: parsed, usage: res.usage };
}
