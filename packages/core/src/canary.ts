/**
 * Canary auto-revert — close the loop on merged self-improvements.  [v1.0]
 * After an autonomous merge we record a baseline error rate + the prior file contents + a watch window.
 * On a later autonomy pass, if health regressed beyond the delta once the window has elapsed, we open a
 * REVERT PR restoring the prior contents (rollback is mandatory — the Replit lesson). Else mark healthy.
 */
import { supabase } from "./supabase.js";
import { log } from "./logger.js";
import { revert } from "./mergequeue.js";
import type { GitHub } from "./github.js";

/** Pure decision: should this canary be reverted given the current error rate and time? */
export function shouldRevert(c: { baselineErrorRate: number; watchUntil: string }, currentErrorRate: number, now = Date.now(), delta = Number(process.env.CANARY_ERROR_DELTA || 0.15)): boolean {
  if (new Date(c.watchUntil).getTime() > now) return false; // still inside the watch window
  return currentErrorRate - c.baselineErrorRate > delta;
}

export async function openCanary(prNumber: number, restore: { path: string; content: string }[], baselineErrorRate: number, windowMin = Number(process.env.CANARY_WINDOW_MIN || 30)) {
  try {
    await supabase.from("canaries").insert({
      pr_number: prNumber, restore, baseline_error_rate: baselineErrorRate,
      watch_until: new Date(Date.now() + windowMin * 60000).toISOString(), status: "watching", created_at: new Date().toISOString(),
    });
  } catch (e) { log.debug("openCanary failed", { err: String(e) }); }
}

export async function checkCanaries(gh: GitHub, currentErrorRate: number): Promise<{ reverted: number; healthy: number }> {
  let reverted = 0, healthy = 0;
  try {
    const { data } = await supabase.from("canaries").select("*").eq("status", "watching");
    for (const c of data || []) {
      if (new Date(c.watch_until).getTime() > Date.now()) continue; // still watching
      if (shouldRevert({ baselineErrorRate: c.baseline_error_rate, watchUntil: c.watch_until }, currentErrorRate)) {
        try { await revert(gh, c.pr_number, c.restore || [], `hata oranı ${currentErrorRate} > baseline ${c.baseline_error_rate}`); reverted++; await supabase.from("canaries").update({ status: "reverted" }).eq("id", c.id); }
        catch (e) { log.warn("canary revert failed", { err: String(e) }); }
      } else { healthy++; await supabase.from("canaries").update({ status: "healthy" }).eq("id", c.id); }
    }
  } catch (e) { log.debug("checkCanaries failed", { err: String(e) }); }
  return { reverted, healthy };
}
