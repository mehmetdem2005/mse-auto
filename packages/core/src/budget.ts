/**
 * Cost & quota governance. An autonomous AI pipeline can quietly burn money (Gemini Pro,
 * image gen, TTS) or blow the finite YouTube quota. This records every billable unit and
 * pauses the pipeline before it overspends — so "autonomous" never means "surprise bill".
 */
import { supabase } from "./supabase.js";
import { env, COST } from "./env.js";
import { logEvent } from "./events.js";

type UsageKind = "text" | "reasoning" | "image" | "tts" | "embed" | "youtube_units";

/** Record a billable unit. `units` meaning depends on kind (tokens, chars, calls, quota units). */
export async function recordUsage(kind: UsageKind, units: number, jobId?: string) {
  const cost = estimateCost(kind, units);
  try {
    await Promise.race([
      supabase.from("usage_ledger").insert({ kind, units, cost_usd: cost, job_id: jobId ?? null }),
      new Promise((res) => setTimeout(res, 800)),
    ]);
  } catch { /* telemetry must never block the pipeline */ }
}


export function estimateCost(kind: UsageKind, units: number): number {
  switch (kind) {
    case "text": return (units / 1000) * COST.textPer1kTokens;
    case "reasoning": return (units / 1000) * COST.reasoningPer1kTokens;
    case "image": return units * COST.imagePerCall;
    case "tts": return (units / 1000) * COST.ttsPer1kChars;
    case "embed": return (units / 1000) * COST.embedPer1kTokens;
    case "youtube_units": return 0; // quota, not money
  }
}

export interface BudgetStatus { usdToday: number; youtubeUnitsToday: number; overBudget: boolean; reason?: string; }

export async function budgetStatus(): Promise<BudgetStatus> {
  const since = new Date(); since.setUTCHours(0, 0, 0, 0);
  const { data } = await supabase
    .from("usage_ledger").select("kind,units,cost_usd").gte("created_at", since.toISOString());
  let usd = 0, units = 0;
  for (const r of data ?? []) {
    usd += Number(r.cost_usd || 0);
    if (r.kind === "youtube_units") units += Number(r.units || 0);
  }
  const e = env();
  let reason: string | undefined;
  if (e.DAILY_USD_CAP > 0 && usd >= e.DAILY_USD_CAP) reason = `daily USD cap reached ($${usd.toFixed(2)}/$${e.DAILY_USD_CAP})`;
  if (e.DAILY_YOUTUBE_UNITS_CAP > 0 && units >= e.DAILY_YOUTUBE_UNITS_CAP) reason = `daily YouTube quota cap reached (${units}/${e.DAILY_YOUTUBE_UNITS_CAP})`;
  return { usdToday: usd, youtubeUnitsToday: units, overBudget: !!reason, reason };
}

/** Throw (and emit an event) if we're over budget — the runner treats this as a pause signal. */
export async function assertWithinBudget(jobId?: string) {
  const s = await budgetStatus();
  if (s.overBudget) {
    await logEvent({ jobId, type: "budget_pause", data: { reason: s.reason, ...s } });
    throw new Error(`Budget guard: ${s.reason}`);
  }
}
