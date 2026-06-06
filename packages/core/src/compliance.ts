/**
 * Compliance & channel-survival guards.
 *
 * This is the HONEST "defense" against being flagged. It does NOT try to evade or trick
 * YouTube's detection. Instead it keeps you on the right side of the rules that actually
 * get channels terminated in 2026:
 *   - Inauthentic / "AI slop" policy → enforce ORIGINALITY + format VARIATION + a low cap.
 *   - Synthetic-content disclosure   → flag every AI video and put a disclosure line in.
 *   - Spam/velocity                  → daily cap + spacing (handled in scheduler).
 * If a draft looks too templated or too similar to a recent upload, we REFUSE it and ask
 * for a fresh angle rather than shipping near-duplicates.
 */
import { maxSimilarityToRecent } from "./rag.js";
import { supabase } from "./supabase.js";
import type { ShortScript, ChannelConfig } from "./types.js";

// A pool of distinct visual/voice "styles" so consecutive videos don't look identical.
export const STYLE_POOL = [
  "ink-illustration / warm narrator / Kore",
  "paper-cutout collage / curious narrator / Puck",
  "high-contrast photographic-abstract / measured narrator / Charon",
  "retro-archive grain / storyteller narrator / Kore",
  "minimal-typographic / punchy narrator / Fenrir",
];

/** Pick a style that differs from the last few used (variation requirement). */
export async function pickStyle(): Promise<string> {
  const { data } = await supabase
    .from("video_jobs")
    .select("script")
    .not("script", "is", null)
    .order("created_at", { ascending: false })
    .limit(3);
  const recent = new Set((data ?? []).map((r: any) => r.script?.styleId).filter(Boolean));
  const fresh = STYLE_POOL.filter((s) => !recent.has(s));
  const pool = fresh.length ? fresh : STYLE_POOL;
  return pool[Math.floor(Math.random() * pool.length)];
}

export interface ComplianceResult {
  ok: boolean;
  reasons: string[];
  similarity: number;
}

/** Run all originality/quality gates on a draft before it's allowed to be produced. */
export async function checkScript(
  script: ShortScript,
  cfg: ChannelConfig,
): Promise<ComplianceResult> {
  const reasons: string[] = [];

  // 1) Originality vs recent uploads (semantic). Reject near-duplicates.
  const similarity = await maxSimilarityToRecent(script.narrationText);
  const THRESH = Number(process.env.ORIGINALITY_THRESHOLD || 0.9);
  if (similarity > THRESH)
    reasons.push(`Too similar to a recent video (cosine ${similarity.toFixed(2)} > ${THRESH}). Pick a fresh angle.`);

  // 2) Must carry an original commentary layer (not just facts).
  if (!script.commentary || script.commentary.trim().length < 40)
    reasons.push("Missing a real commentary/original-angle layer (required by YT inauthentic-content policy).");

  // 3) Must cite at least one source (anti-misinformation).
  if (!script.sources?.length)
    reasons.push("No sources cited — refuse to publish unverifiable claims.");

  // 4) Disclosure line must be present in the description.
  if (!/yapay zek|AI|synthetic|üretil/i.test(script.description))
    reasons.push("Description is missing an AI-disclosure line.");

  // 5) Daily cap (defence-in-depth; scheduler also enforces).
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("video_jobs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", today.toISOString())
    .in("stage", ["scheduled", "uploading", "published"]);
  if ((count ?? 0) >= cfg.maxPerDay)
    reasons.push(`Daily cap reached (${cfg.maxPerDay}). Quality > volume.`);

  return { ok: reasons.length === 0, reasons, similarity };
}

/** Builds the disclosure metadata the uploader will use. */
export function disclosure(script: ShortScript) {
  return {
    madeWithAI: true,
    descriptionLine:
      script.language === "tr"
        ? "\n\n— Bu video AI araçları (Gemini) kullanılarak hazırlanmıştır."
        : "\n\n— This video was created using AI tools (Gemini).",
  };
}
