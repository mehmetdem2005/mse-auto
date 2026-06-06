/**
 * Durable agent state — checkpointing & resume.  [v0.6]
 *
 * Research (2026): LangGraph's signature production feature is built-in checkpointing with resume
 * and time-travel; the antipattern is losing all swarm work on a crash. A swarm here can be many
 * coordinated LLM/tool steps, so we persist its state (plan + completed tasks + blackboard) after
 * each wave. If the worker crashes/redeploys mid-swarm, the next attempt RESUMES instead of
 * redoing expensive work. The checkpoint is also a time-travel/inspection record of the run.
 */
import { supabase } from "./supabase.js";
import { log } from "./logger.js";

export interface Checkpoint {
  plan: any[];
  completed: string[];
  blackboard: Record<string, any>;
  status: "running" | "done" | "failed";
}

export interface Checkpointer {
  load(runId: string): Promise<Checkpoint | null>;
  save(runId: string, cp: Checkpoint): Promise<void>;
  clear(runId: string): Promise<void>;
}

/** In-memory checkpointer (tests / single-tick runs). */
export class MemoryCheckpointer implements Checkpointer {
  private m = new Map<string, Checkpoint>();
  async load(id: string) { return this.m.get(id) ?? null; }
  async save(id: string, cp: Checkpoint) { this.m.set(id, cp); }
  async clear(id: string) { this.m.delete(id); }
}

/** Supabase-backed checkpointer (production). Requires migration 0005 (agent_runs). */
export class SupabaseCheckpointer implements Checkpointer {
  async load(runId: string): Promise<Checkpoint | null> {
    try {
      const { data } = await supabase.from("agent_runs").select("*").eq("job_id", runId).single();
      if (!data) return null;
      return { plan: data.plan ?? [], completed: data.completed ?? [], blackboard: data.blackboard ?? {}, status: data.status ?? "running" };
    } catch { return null; }
  }
  async save(runId: string, cp: Checkpoint) {
    try {
      await supabase.from("agent_runs").upsert({
        job_id: runId, plan: cp.plan, completed: cp.completed, blackboard: cp.blackboard,
        status: cp.status, updated_at: new Date().toISOString(),
      });
    } catch (e) { log.debug("checkpoint save failed", { err: String(e) }); }
  }
  async clear(runId: string) { try { await supabase.from("agent_runs").delete().eq("job_id", runId); } catch {} }
}
