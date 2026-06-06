/**
 * Prompt auto-improvement — GEPA-style reflective prompt evolution.  [v0.9]
 * Research (GEPA, ICLR 2026 Oral): an LLM-judge returns a score + ASI (Actionable Side Information:
 * why it failed). A reflector reads the ASI and proposes a targeted improved prompt; keep it ONLY if it
 * beats the current on a validation set (Pareto). Text feedback beats scalar reward. Model is the ceiling.
 */
import { generate, MODELS } from "./gemini.js";
import { recordUsage } from "./budget.js";
import { supabase } from "./supabase.js";

export interface Judgement { score: number; asi: string; }
const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

const JUDGE_SCHEMA = { type: "object", properties: { score: { type: "number" }, asi: { type: "string" } }, required: ["score", "asi"] };
export async function judge(sample: { input: string; output: string }, rubric: string, gen = (async (a: any) => generate({ model: MODELS.reasoning, ...a }))): Promise<Judgement> {
  const r = await gen({ system: "Sen bir LLM-yargıçsın. Çıktıyı rubriğe göre 0-1 puanla ve ASI yaz (neden: hata/kısıt ihlali/eksik). SADECE JSON.", prompt: `RUBRİK: ${rubric}\nGİRDİ: ${sample.input}\nÇIKTI: ${sample.output}`, responseSchema: JUDGE_SCHEMA });
  await recordUsage("reasoning", r.usage?.totalTokens || 1);
  try { return JSON.parse(r.text); } catch { return { score: 0, asi: "parse error" }; }
}

const PROPOSE_SCHEMA = { type: "object", properties: { prompt: { type: "string" }, rationale: { type: "string" } }, required: ["prompt"] };
export async function reflectAndPropose(current: string, feedback: string[], gen = (async (a: any) => generate({ model: MODELS.reasoning, ...a }))): Promise<{ prompt: string; rationale?: string } | null> {
  const r = await gen({ system: "GEPA reflektörü: aşağıdaki ASI geri bildirimlerinden MEVCUT sistem promptunu HEDEFLİ biçimde iyileştir; davranışı bozmadan netleştir. Sadece yeni sistem promptunu döndür. SADECE JSON.", prompt: `MEVCUT PROMPT:\n${current}\n\nASI GERİ BİLDİRİM:\n${feedback.join("\n")}`, responseSchema: PROPOSE_SCHEMA });
  await recordUsage("reasoning", r.usage?.totalTokens || 1);
  try { const p = JSON.parse(r.text); return p?.prompt ? p : null; } catch { return null; }
}

/** Optimize a prompt on an eval set; keep the candidate only if it improves the score. */
export async function optimizePrompt(
  name: string, current: string, evalSet: { input: string; output: string }[], rubric: string,
  deps: { judge?: typeof judge; propose?: typeof reflectAndPropose; render?: (prompt: string, input: string) => Promise<string> } = {},
): Promise<{ prompt: string; improved: boolean; before: number; after: number; rationale?: string }> {
  const J = deps.judge || judge, P = deps.propose || reflectAndPropose;
  const curJ = await Promise.all(evalSet.map((s) => J(s, rubric)));
  const before = avg(curJ.map((x) => x.score));
  const feedback = curJ.filter((x) => x.score < 0.8).map((x) => x.asi).slice(0, 8);
  const proposal = await P(current, feedback);
  if (!proposal) return { prompt: current, improved: false, before, after: before };
  const candSamples = deps.render ? await Promise.all(evalSet.map(async (s) => ({ input: s.input, output: await deps.render!(proposal.prompt, s.input) }))) : evalSet;
  const candJ = await Promise.all(candSamples.map((s) => J(s, rubric)));
  const after = avg(candJ.map((x) => x.score));
  const improved = after > before + 0.02;
  if (improved) { try { await supabase.from("prompts").insert({ name, prompt: proposal.prompt, score: after, rationale: proposal.rationale, created_at: new Date().toISOString() }); } catch {} }
  return { prompt: improved ? proposal.prompt : current, improved, before, after, rationale: proposal.rationale };
}

/** Fetch the best stored prompt for a name (else fallback). */
export async function activePrompt(name: string, fallback: string): Promise<string> {
  try { const { data } = await supabase.from("prompts").select("prompt").eq("name", name).order("score", { ascending: false }).limit(1).single(); return data?.prompt || fallback; }
  catch { return fallback; }
}

const _promptCache = new Map<string, { v: string; exp: number }>();
/** Cached best-prompt lookup so agents can swap to improved prompts cheaply (TTL default 5 min). */
export async function getActivePrompt(name: string, fallback: string, ttlMs = 300000): Promise<string> {
  const c = _promptCache.get(name);
  if (c && Date.now() < c.exp) return c.v;
  const v = await Promise.race([
    activePrompt(name, fallback).catch(() => fallback),
    new Promise<string>((res) => setTimeout(() => res(fallback), 800)),
  ]);
  _promptCache.set(name, { v, exp: Date.now() + ttlMs });
  return v;
}
export function _clearPromptCache() { _promptCache.clear(); }
