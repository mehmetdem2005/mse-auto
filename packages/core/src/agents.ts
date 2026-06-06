/**
 * EDITORIAL AGENT SYSTEM — "alt-üst" (top-down delegate / bottom-up escalate).  [v0.4]
 *
 * Inspired by how real newsrooms/companies ship, and by Kimi's Agent Swarm (a lead orchestrator
 * decomposes a goal into domain-specialized sub-agents, runs them, and integrates the results;
 * the app — not the model — executes/validates each step). Here:
 *
 *   TOP-DOWN:  Orchestrator → Producer (scriptwriter) drafts the artifact.
 *   PARALLEL:  A REVIEW BOARD of ≥5 specialized auditors independently scores it
 *              (accuracy, policy, copyright, editorial, retention, language).
 *   BOTTOM-UP: Verdicts escalate to a Chief Editor that CONSOLIDATES them with veto rules
 *              (legal/policy/accuracy/child-safety can block on their own, like real sign-off).
 *              If "revise", required fixes flow DOWN to a Reviser and the loop repeats.
 *              If it still can't pass (or a critical blocker stands), it escalates to a HUMAN.
 *
 * Quality over speed by design: every artifact gets ≥5 independent sign-offs. It costs more
 * Gemini calls and more time — acceptable per the spec. The rate limiter + budget guard keep
 * cost and quota safe; the human gate stays the final approval (and the YouTube-survival design).
 */
import { generate, SHORT_SCRIPT_SCHEMA, MODELS, type GenUsage } from "./gemini.js";
import { writeScript } from "./scriptwriter.js";
import { recordUsage } from "./budget.js";
import { log } from "./logger.js";
import type { ShortScript } from "./types.js";

const REVIEW_MODEL = process.env.REVIEW_MODEL || MODELS.text;       // cheap/fast model for auditors
const REVISE_MODEL = process.env.REVISE_MODEL || MODELS.reasoning;  // strong model for revisions
const QUORUM = Number(process.env.REVIEWER_QUORUM || 5);            // ≥ this many passes to approve
const MAX_ROUNDS = Number(process.env.MAX_REVISE_ROUNDS || 2);      // revise attempts before human

export type Severity = "none" | "minor" | "major" | "critical";
export interface Verdict {
  role: string; title: string; critical: boolean;
  pass: boolean; score: number; severity: Severity;
  issues: string[]; required_fixes: string[];
}
export interface Decision { verdict: "approve" | "revise" | "blocked"; score: number; passCount: number; fixes: string[]; blockers: string[]; }
export interface ReviewReport { rounds: number; reviewerCount: number; quorum: number; decision: Decision; verdicts: Verdict[]; editor_note: string; }

const VERDICT_SCHEMA = {
  type: "object",
  properties: {
    pass: { type: "boolean" },
    score: { type: "number" },
    severity: { type: "string", enum: ["none", "minor", "major", "critical"] },
    issues: { type: "array", items: { type: "string" } },
    required_fixes: { type: "array", items: { type: "string" } },
  },
  required: ["pass", "score", "severity", "issues", "required_fixes"],
};

interface Reviewer { id: string; title: string; critical: boolean; useSearch: boolean; system: string; }

/** The board. `critical: true` reviewers can VETO (block) on their own — like legal/compliance. */
const REVIEWERS: Reviewer[] = [
  { id: "accuracy", title: "Doğruluk Denetçisi", critical: true, useSearch: true, system:
    `Sen kıdemli bir olgu denetçisisin (fact-checker). Senaryodaki HER iddiayı, verilen kaynaklara ve gerektiğinde web aramasına göre doğrula. Doğrulanamayan, abartılı veya yanlış tek bir iddia bile varsa pass=false ve severity=critical ver. required_fixes'te tam olarak hangi cümlenin düzeltilmesi/çıkarılması gerektiğini yaz.` },
  { id: "policy", title: "Politika/Uyumluluk Denetçisi", critical: true, useSearch: false, system:
    `Sen YouTube politika ve uyumluluk denetçisisin. Kontrol et: (1) yapay zekâ ifşası açık mı, (2) "şablon/yığın AI içerik" gibi mi görünüyor (özgün yorum var mı), (3) çocuk güvenliği/şiddet/yanıltma riski, (4) gerçek bir kişiyi taklit/iftira yok. Ciddi ihlalde severity=critical, pass=false. Türkçe net required_fixes ver.` },
  { id: "copyright", title: "Telif/Hukuk Denetçisi", critical: true, useSearch: false, system:
    `Sen telif ve hukuk denetçisisin. Şarkı sözü/şiir/telifli karakter/markaların birebir kullanımı, telifli görsel/footage tarif eden visualPrompts, lisanssız müzik ima eden ifadeler için kontrol et. Riskli tek bir öğe bile severity=critical, pass=false. required_fixes'te özgün/telifsiz alternatif iste.` },
  { id: "editorial", title: "Editöryel/Marka Sesi Denetçisi", critical: false, useSearch: false, system:
    `Sen baş editörün editöryel kalite denetçisisin. ÖZGÜN yorum katmanı gerçekten var mı, ses tutarlı mı, kuru bilgi okuması mı yoksa bir bakış açısı mı sunuyor? Klişe/AI-slop dilini işaretle. Zayıfsa pass=false (severity=major). required_fixes ile somut iyileştirme iste.` },
  { id: "retention", title: "Retention/Hook Denetçisi", critical: false, useSearch: false, system:
    `Sen kısa-video retention uzmanısın. İlk 2 saniyedeki hook gücü, açık döngü, tempo, payoff ve CTA'yı puanla. Süre ~45-55 sn Shorts'a uygun mu? Zayıf hook severity=major, pass=false. required_fixes ile daha güçlü hook/yapı öner.` },
  { id: "language", title: "Dil/Yerelleştirme Denetçisi", critical: false, useSearch: false, system:
    `Sen Türkçe dil editörüsün. Dilbilgisi, akıcılık, doğal seslendirme metni ve onScreenText netliğini denetle. Bozuk/awkward ifadeleri işaretle (severity=minor/major). required_fixes ile düzeltmeleri yaz.` },
];

function artifactBlock(s: ShortScript): string {
  const pick = {
    title: s.title, hook: s.hook, beats: s.beats, payoff: s.payoff, commentary: s.commentary,
    cta: s.cta, onScreenText: s.onScreenText, visualPrompts: s.visualPrompts, tags: s.tags,
    sources: s.sources, narrationText: s.narrationText, estDurationSec: s.estDurationSec,
  };
  return "İNCELENECEK SENARYO (JSON):\n" + JSON.stringify(pick).slice(0, 8000);
}

async function reviewerCall(r: Reviewer, script: ShortScript): Promise<Verdict> {
  try {
    const res = await generate({ model: REVIEW_MODEL, system: r.system, prompt: artifactBlock(script), responseSchema: VERDICT_SCHEMA, search: r.useSearch });
    await recordUsage("text", res.usage.totalTokens || 1);
    let v: any;
    try { v = JSON.parse(res.text); } catch { const m = res.text.match(/\{[\s\S]*\}/); v = m ? JSON.parse(m[0]) : {}; }
    return {
      role: r.id, title: r.title, critical: r.critical,
      pass: !!v.pass, score: Number(v.score ?? 0), severity: (v.severity ?? "major") as Severity,
      issues: Array.isArray(v.issues) ? v.issues : [], required_fixes: Array.isArray(v.required_fixes) ? v.required_fixes : [],
    };
  } catch (e: any) {
    // A reviewer that errors (safety/parse/timeout) counts as a non-pass needing attention.
    log.warn("reviewer failed", { role: r.id, err: String(e?.message || e) });
    return { role: r.id, title: r.title, critical: r.critical, pass: false, score: 0, severity: r.critical ? "critical" : "major", issues: [`Denetçi çalışmadı: ${String(e?.message || e)}`], required_fixes: [] };
  }
}

/** Run the full board in parallel (the rate limiter paces the underlying calls). */
export async function reviewBoard(script: ShortScript): Promise<Verdict[]> {
  return Promise.all(REVIEWERS.map((r) => reviewerCall(r, script)));
}

/** Chief Editor consolidation — PURE & testable. Critical reviewers can veto. */
export function consolidate(verdicts: Verdict[], quorum = QUORUM): Decision {
  const dedupe = (xs: string[]) => Array.from(new Set(xs.filter(Boolean)));
  const score = verdicts.length ? Math.round(verdicts.reduce((a, v) => a + v.score, 0) / verdicts.length) : 0;
  const blockers = verdicts.filter((v) => v.severity === "critical" || (v.critical && !v.pass));
  if (blockers.length)
    return { verdict: "blocked", score, passCount: verdicts.filter((v) => v.pass).length, fixes: dedupe(verdicts.flatMap((v) => v.required_fixes)), blockers: blockers.map((b) => b.role) };
  const passCount = verdicts.filter((v) => v.pass).length;
  if (passCount >= quorum) return { verdict: "approve", score, passCount, fixes: [], blockers: [] };
  return { verdict: "revise", score, passCount, fixes: dedupe(verdicts.filter((v) => !v.pass).flatMap((v) => v.required_fixes)), blockers: [] };
}

async function revise(script: ShortScript, fixes: string[]): Promise<ShortScript> {
  const system = `Sen kıdemli bir revizyon editörüsün. Sana bir Shorts senaryosu ve denetçilerin ZORUNLU düzeltmeleri verilecek. Senaryoyu, tüm düzeltmeleri uygulayarak ve doğruluğu/özgünlüğü koruyarak yeniden yaz. Aynı JSON şemasıyla döndür.`;
  const prompt = `MEVCUT SENARYO:\n${JSON.stringify(script).slice(0, 8000)}\n\nZORUNLU DÜZELTMELER:\n- ${fixes.join("\n- ")}`;
  const res = await generate({ model: REVISE_MODEL, system, prompt, responseSchema: SHORT_SCRIPT_SCHEMA, thinkingLevel: "high" });
  await recordUsage("reasoning", res.usage.totalTokens || 1);
  let next: ShortScript;
  try { next = JSON.parse(res.text); } catch { const m = res.text.match(/\{[\s\S]*\}/); next = m ? JSON.parse(m[0]) : script; }
  next.styleId = script.styleId; next.language = script.language;
  return next;
}

async function editorNote(topic: string, decision: Decision, verdicts: Verdict[]): Promise<string> {
  try {
    const res = await generate({
      model: REVIEW_MODEL,
      system: "Sen baş editörsün. Denetim sonucunu 2-3 cümlelik net bir Türkçe özetle: karar, öne çıkan riskler ve insana neden gidiyorsa nedeni.",
      prompt: `KARAR: ${decision.verdict} (skor ${decision.score}, ${decision.passCount}/${verdicts.length} onay)\nVETO: ${decision.blockers.join(", ") || "yok"}\nDÜZELTMELER: ${decision.fixes.slice(0, 8).join(" | ") || "yok"}`,
    });
    await recordUsage("text", res.usage.totalTokens || 1);
    return res.text.trim();
  } catch { return `Karar: ${decision.verdict} · skor ${decision.score} · ${decision.passCount}/${verdicts.length} onay${decision.blockers.length ? ` · veto: ${decision.blockers.join(", ")}` : ""}`; }
}

/** The board → consolidate → revise loop (reused by both the simple and the swarm pipelines). */
export async function reviewLoop(script: ShortScript, topic: string): Promise<{ script: ShortScript; report: ReviewReport }> {
  let verdicts: Verdict[] = [];
  let decision: Decision = { verdict: "revise", score: 0, passCount: 0, fixes: [], blockers: [] };
  let rounds = 0;
  for (let round = 1; round <= MAX_ROUNDS + 1; round++) {
    rounds = round;
    verdicts = await reviewBoard(script);
    decision = consolidate(verdicts);
    log.info("review round", { round, verdict: decision.verdict, score: decision.score, passCount: decision.passCount, blockers: decision.blockers });
    if (decision.verdict === "approve" || decision.verdict === "blocked") break;
    if (round > MAX_ROUNDS) break;                 // revise budget exhausted → escalate to human
    script = await revise(script, decision.fixes);  // delegate fixes DOWN, then re-review
  }
  const note = await editorNote(topic, decision, verdicts);
  return { script, report: { rounds, reviewerCount: REVIEWERS.length, quorum: QUORUM, decision, verdicts, editor_note: note } };
}

/** Orchestrate produce → review board → consolidate → (revise loop) → report. */
export async function runEditorialPipeline(opts: { topic: string; language?: string; styleId: string }): Promise<{ script: ShortScript; report: ReviewReport; usage: GenUsage }> {
  const { script, usage } = await writeScript({ topic: opts.topic, language: opts.language, styleId: opts.styleId, useSearch: true });
  const { script: reviewed, report } = await reviewLoop(script, opts.topic);
  await recordUsage("reasoning", usage.totalTokens || 1);
  return { script: reviewed, report, usage };
}

export const REVIEWER_IDS = REVIEWERS.map((r) => r.id);

/** Public metadata for the UI (no behavior) — the review board roster. */
export const REVIEWERS_META = REVIEWERS.map((r) => ({
  id: r.id, title: r.title, critical: r.critical, description: r.system,
}));
