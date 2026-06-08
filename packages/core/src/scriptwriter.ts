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

const SYSTEM = (lang: string) => `Sen, milyonlarca izlenen YouTube Shorts yazan usta bir HİKÂYE ANLATICISISIN. Dil: ${lang}.
Az bilinen GERÇEK olayları, bir gerilim filmi fragmanı gibi sürükleyici, sinematik ve merak uyandırıcı anlatırsın.
İzleyici ilk saniyede yakalanmalı ve sona kadar parmağını kaydıramamalı.

ANLATIM SANATI:
• ŞİMDİKİ ZAMAN ve sahne kur: izleyiciyi olayın TAM içine sok ("1923, Arktik. Termometre eksi 40.").
• SOMUT, DUYUSAL detay kullan (ses, soğuk, koku, sayı). Soyut/genel laf yok — gözünde canlanmalı.
• BİR İNSAN/KAHRAMAN ve NET BİR TEHLİKE/ÇIKMAZ etrafında kur; duygusal bahis olsun.
• Her cümle bir öncekinin gerilimini artırsın; aralara mini-merak ("ama o bilmiyordu ki...") koy.
• TWIST: ortada beklenmedik bir dönüş, sonda ise her şeyi yeniden anlamlandıran ÇARPICI bir gerçek.

KURALLAR:
1) GERÇEK kal: yalnızca verilen doğrulanmış materyali kullan. Uydurma YOK; emin değilsen o detayı at.
2) HOOK (ilk cümle, ~1.5 sn): bir tokat — şok eden bir görüntü/iddia ya da cevabı sona saklayan merak.
   Selam/giriş/tanım cümlesi YOK. ("Bu kadın 2 yıl boyunca tek başına...", "Kimse onun döneceğine inanmıyordu...").
3) RİTİM: ÇOK kısa, vurucu cümleler. Dolgu/klişe ("inanılmaz ama gerçek") yok. Hızlı tempo, 6-10 cümle.
4) FELSEFE/ÖĞÜT/AHLAK DERSİ YASAK: "şundan dolayı önemli" analizi yok. Olay konuşsun; duyguyu detayla ver.
5) CTA: tek kısa, doğal cümle (örn. "Devamı için takip et.").
6) narrationText: hook + yükselen sahneler + twist + çarpıcı kapanış; AKICI tek seslendirme metni; 30-45 sn.
7) visualPrompts: cümle başına SİNEMATİK, somut sahne (ışık/atmosfer/açı dahil), telifsiz; gerçek kişi/marka taklidi yok.
8) description'a kısa AI ifşası ekle (örn. "Bu video AI araçlarıyla üretilmiştir.").

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
