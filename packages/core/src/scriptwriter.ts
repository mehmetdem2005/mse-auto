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

const SYSTEM = (lang: string) => `Sen, "az bilinen ama GERÇEK dünya olayları" anlatan bir YouTube Shorts kanalı için
kıdemli bir senaryo yazarısın. Dil: ${lang}.

KURALLAR:
1) Sadece sana verilen DOĞRULANMIŞ kaynak materyali ve grounding sonuçlarını kullan. Uydurma YOK.
   Emin değilsen o detayı at. Her iddianın arkasında verilebilir bir kaynak olmalı.
2) Retention için yaz: ilk cümle (hook) 2 saniyede şok/merak yaratan bir tokat olmalı —
   selam/giriş YOK. Kısa cümleler. "Ama / meğer / tahmin et" ile açık döngü. Patlamayı sona sakla.
3) ÖZGÜN KATMAN ZORUNLU: kuru bilgi okumak yasak. Olaya senin kendi yorumunu/çerçeveni/
   "bu neden önemli" analizini ekle. Bu, kanalın YouTube tarafından "şablon AI içerik" diye
   kapatılmaması için en kritik şey.
4) Görsel istemler (visualPrompts) telifsiz ve ÖZGÜN olmalı: gerçek kişileri/markaları/
   telifli karakterleri taklit etme; soyut, sembolik, çizimsel sahneler tarif et.
5) description içine net bir AI ifşa satırı koy (örn. "Bu video AI araçlarıyla üretilmiştir.").
6) narrationText, beats + payoff + commentary + cta'dan akıcı tek bir seslendirme metni olmalı,
   ~45-55 saniyeyi geçmemeli (Shorts).

Çıktıyı SADECE şu JSON şemasıyla ver (markdown yok):
{
 "hook": "", "beats": ["",""], "payoff": "", "cta": "",
 "commentary": "", "onScreenText": ["",""], "visualPrompts": ["",""],
 "title": "", "description": "", "tags": ["",""],
 "sources": [{"title":"","url":""}],
 "narrationText": "", "estDurationSec": 50, "language": "${lang}", "styleId": ""
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
