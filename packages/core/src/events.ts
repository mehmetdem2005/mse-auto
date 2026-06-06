/**
 * Append-only event/audit trail. EVERY meaningful thing that happens to a job is recorded:
 * stage transitions, retries, errors, external-call durations, human approvals, budget pauses.
 * This is the backbone of "izlenebilir" (traceable): the Observability page replays this,
 * and you can answer "what happened to job X and why" without guessing.
 */
import { supabase } from "./supabase.js";
import { log } from "./logger.js";

export type EventType =
  | "created" | "stage_enter" | "stage_ok" | "retry" | "error" | "dead_letter"
  | "approved" | "rejected" | "uploaded" | "budget_pause" | "control_pause" | "control_resume"
  | "lock_acquired" | "lock_expired" | "usage";

export async function logEvent(args: {
  jobId?: string;
  traceId?: string;
  stage?: string;
  type: EventType;
  data?: Record<string, unknown>;
  durationMs?: number;
}) {
  // Structured log first (always works, even if the DB write fails).
  log.child({ jobId: args.jobId, traceId: args.traceId, stage: args.stage })
    .info(`event:${args.type}`, { ...args.data, durationMs: args.durationMs });
  try {
    await supabase.from("job_events").insert({
      job_id: args.jobId ?? null,
      trace_id: args.traceId ?? null,
      stage: args.stage ?? null,
      type: args.type,
      data: args.data ?? {},
      duration_ms: args.durationMs ?? null,
    });
  } catch (e) {
    log.error("failed to persist event", { type: args.type, err: String(e) });
  }
}

/** Wrap an async step to auto-emit stage_enter / stage_ok / error with timing. */
export async function tracedStage<T>(
  ctx: { jobId?: string; traceId?: string; stage: string },
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  await logEvent({ ...ctx, type: "stage_enter" });
  try {
    const out = await fn();
    await logEvent({ ...ctx, type: "stage_ok", durationMs: Date.now() - start });
    return out;
  } catch (e: any) {
    await logEvent({ ...ctx, type: "error", durationMs: Date.now() - start, data: { message: String(e?.message || e) } });
    throw e;
  }
}
