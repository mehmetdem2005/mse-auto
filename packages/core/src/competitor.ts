/**
 * Competitor analysis — comments + transcript → actionable insights.  [v0.8]
 * Research: reverse-engineer outliers (winning hooks, content gaps, audience requests). Transcript via
 * public timedtext (best-effort, no key). Live calls are best-effort; analysis is schema-validated JSON.
 */
import { generate, MODELS } from "./gemini.js";
import { recordUsage } from "./budget.js";
import { log } from "./logger.js";

export async function fetchTranscript(videoId: string, fetchImpl: any = (globalThis as any).fetch): Promise<string> {
  try {
    const r = await fetchImpl(`https://video.google.com/timedtext?lang=en&v=${encodeURIComponent(videoId)}`);
    if (!r.ok) return "";
    const xml = await r.text();
    return (xml.match(/<text[^>]*>([\s\S]*?)<\/text>/g) || [])
      .map((t: string) => t.replace(/<[^>]+>/g, "").replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"'))
      .join(" ").slice(0, 8000);
  } catch { return ""; }
}

const INSIGHT_SCHEMA = { type: "object", properties: { winningHooks: { type: "array", items: { type: "string" } }, gaps: { type: "array", items: { type: "string" } }, audienceRequests: { type: "array", items: { type: "string" } }, formatNotes: { type: "string" } }, required: ["winningHooks", "gaps"] };

export async function analyzeCompetitor(videoId: string, gen = (async (a: any) => generate({ model: MODELS.reasoning, ...a }))): Promise<any | null> {
  const { fetchCommentThreads } = await import("./youtube.js");
  const [comments, transcript] = await Promise.all([fetchCommentThreads(videoId, 30).catch(() => []), fetchTranscript(videoId).catch(() => "")]);
  if (!comments.length && !transcript) return null;
  try {
    const r = await gen({ system: "Rakip Short'unu analiz et: kazanan hook'lar, içerik boşlukları, izleyici istekleri, format notları. SADECE JSON.", prompt: `TRANSKRİPT:\n${transcript}\n\nYORUMLAR:\n${comments.map((c: any) => "- " + c.text).join("\n").slice(0, 5000)}`, responseSchema: INSIGHT_SCHEMA });
    await recordUsage("reasoning", r.usage?.totalTokens || 1);
    return JSON.parse(r.text);
  } catch (e) { log.debug("analyzeCompetitor failed", { err: String(e) }); return null; }
}
