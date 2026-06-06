/**
 * Broad signal monitor — NOT just errors.  [v0.7]
 * Watches queue/dead-letter/needs-review, video analytics (engagement), and real comments (sentiment +
 * factual-error reports), then turns signals into ranked, actionable OPPORTUNITIES. This is the
 * "take initiative even when nothing is broken" loop the autonomy layer consumes.
 */
import { supabase } from "./supabase.js";
import { generate, MODELS } from "./gemini.js";
import { recordUsage } from "./budget.js";
import { log } from "./logger.js";

export type Severity = "info" | "warn" | "crit";
export interface Signal { kind: string; detail: string; severity: Severity; }
export interface Opportunity { title: string; area: string; severity: Severity; score: number; suggestion: string; }

const SEV: Record<Severity, number> = { info: 1, warn: 2, crit: 3 };
export function scoreOpportunity(o: { severity: Severity; impact?: number }): number { return SEV[o.severity] * 10 + (o.impact ?? 0); }
export function rankOpportunities(list: Opportunity[]): Opportunity[] {
  return [...list].sort((a, b) => (b.score - a.score) || (SEV[b.severity] - SEV[a.severity]));
}

export async function gatherSignals(): Promise<Signal[]> {
  const s: Signal[] = [];
  try {
    const c = async (stage: string) => (await supabase.from("video_jobs").select("id", { count: "exact", head: true }).eq("stage", stage)).count ?? 0;
    const dl = await c("dead_letter"); if (dl > 0) s.push({ kind: "dead_letter", detail: `${dl} iş dead-letter`, severity: "warn" });
    s.push({ kind: "queue_depth", detail: `${await c("queued")} iş kuyrukta`, severity: "info" });
    const nr = await c("needs_review"); if (nr > 0) s.push({ kind: "needs_review", detail: `${nr} iş insan onayı bekliyor`, severity: "info" });
    const { data: a } = await supabase.from("analytics").select("*").order("snapshot_at", { ascending: false }).limit(20);
    for (const v of a ?? []) {
      const views = Number(v.views ?? 0), likes = Number(v.likes ?? 0);
      if (views > 50 && likes / Math.max(1, views) < 0.01) s.push({ kind: "low_engagement", detail: `"${v.title}" beğeni oranı düşük (${likes}/${views})`, severity: "info" });
    }
  } catch (e) { log.debug("gatherSignals partial", { err: String(e) }); }
  return s;
}

const COMMENT_SCHEMA = { type: "object", properties: { issues: { type: "array", items: { type: "string" } }, sentiment: { type: "string" } }, required: ["issues", "sentiment"] };
export async function analyzeComments(videoId: string, gen = (async (a: any) => generate({ model: MODELS.text, ...a }))): Promise<{ issues: string[]; sentiment: string } | null> {
  const { fetchCommentThreads } = await import("./youtube.js");
  const c = await fetchCommentThreads(videoId, 20);
  if (!c.length) return null;
  try {
    const r = await gen({ system: "İzleyici yorumlarını analiz et: olgusal hata iddiası, şikâyet, tekrar eden istek var mı? Genel duygu? SADECE JSON.", prompt: c.map((x) => `- ${x.text}`).join("\n").slice(0, 6000), responseSchema: COMMENT_SCHEMA });
    await recordUsage("text", r.usage?.totalTokens || 1);
    return JSON.parse(r.text);
  } catch (e) { log.debug("analyzeComments failed", { err: String(e) }); return null; }
}

const OPP_SCHEMA = { type: "object", properties: { opportunities: { type: "array", items: { type: "object", properties: { title: { type: "string" }, area: { type: "string" }, severity: { type: "string", enum: ["info", "warn", "crit"] }, suggestion: { type: "string" } }, required: ["title", "area", "severity", "suggestion"] } } }, required: ["opportunities"] };
export async function findOpportunities(signals: Signal[], gen = (async (a: any) => generate({ model: MODELS.reasoning, ...a }))): Promise<Opportunity[]> {
  if (!signals.length) return [];
  try {
    const r = await gen({ system: "Sinyallerden yazılımı/içeriği iyileştirecek SOMUT fırsatlar üret (yalnızca hata değil; düşük etkileşim, kuyruk, bellek vb.). Her biri için alan + öneri. SADECE JSON.", prompt: signals.map((s) => `[${s.severity}] ${s.kind}: ${s.detail}`).join("\n"), responseSchema: OPP_SCHEMA });
    await recordUsage("reasoning", r.usage?.totalTokens || 1);
    const list = (JSON.parse(r.text).opportunities as any[]).map((o) => ({ ...o, score: scoreOpportunity(o) }));
    return rankOpportunities(list);
  } catch (e) { log.debug("findOpportunities failed", { err: String(e) }); return []; }
}

export async function storeOpportunities(list: Opportunity[]) {
  for (const o of list) {
    try { await supabase.from("opportunities").insert({ title: o.title, area: o.area, severity: o.severity, score: o.score, suggestion: o.suggestion, status: "open", created_at: new Date().toISOString() }); } catch {}
  }
}
