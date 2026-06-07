/**
 * Agent state bus — the "AgentStateManager" of the AI CORE control center.
 * Each agent (crew role / review-board auditor / pipeline stage) reports its live status here as
 * the worker runs it. The web panel reads `agent_status` to light up the holographic nodes, and
 * job_events carries the execution trace. Kept fully non-fatal: telemetry must never break a run.
 */
import { supabase } from "./supabase.js";

export type AgentStatus =
  | "idle" | "planning" | "waiting" | "running" | "completed" | "failed" | "blocked" | "needs_user_approval";

export async function setAgent(agentId: string, status: AgentStatus, opts: { task?: string; displayName?: string; progress?: number; jobId?: string } = {}): Promise<void> {
  try {
    await supabase.from("agent_status").upsert({
      agent_id: agentId,
      status,
      display_name: opts.displayName ?? null,
      current_task: opts.task ?? "",
      progress: opts.progress ?? 0,
      job_id: opts.jobId ?? null,
      updated_at: new Date().toISOString(),
    });
  } catch { /* telemetry only */ }
}

/** Wrap an agent's work: marks running before, completed/failed after. Returns the fn's result. */
export async function track<T>(agentId: string, task: string, fn: () => Promise<T>, opts: { displayName?: string; jobId?: string } = {}): Promise<T> {
  await setAgent(agentId, "running", { task, ...opts });
  try {
    const r = await fn();
    await setAgent(agentId, "completed", { task, ...opts });
    return r;
  } catch (e) {
    await setAgent(agentId, "failed", { task: String((e as any)?.message || e).slice(0, 120), ...opts });
    throw e;
  }
}
