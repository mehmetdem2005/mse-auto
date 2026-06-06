/**
 * Metrics — derived numbers for the Observability page and the /status endpoint.
 * Computed from job_events + video_jobs + usage_ledger (no extra writes).
 */
import { supabase } from "./supabase.js";
import { budgetStatus } from "./budget.js";
import { getState } from "./control.js";

export interface SystemMetrics {
  paused: boolean;
  mode: string;
  stageCounts: Record<string, number>;
  published24h: number;
  failed24h: number;
  deadLetter: number;
  errorRate24h: number;          // errors / (errors + stage_ok) in last 24h
  avgStageMs: Record<string, number>;
  usdToday: number;
  youtubeUnitsToday: number;
  overBudget: boolean;
}

export async function getMetrics(): Promise<SystemMetrics> {
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const state = await getState();
  const budget = await budgetStatus();

  // stage counts
  const stages = ["queued", "drafting", "needs_review", "approved", "rendering", "scheduled", "uploading", "published", "failed", "dead_letter"];
  const stageCounts: Record<string, number> = {};
  for (const s of stages) {
    const { count } = await supabase.from("video_jobs").select("id", { count: "exact", head: true }).eq("stage", s);
    stageCounts[s] = count ?? 0;
  }

  // 24h events for error rate + durations
  const { data: ev } = await supabase
    .from("job_events").select("type,stage,duration_ms").gte("created_at", since).limit(5000);
  let ok = 0, err = 0;
  const durs: Record<string, number[]> = {};
  for (const e of ev ?? []) {
    if (e.type === "stage_ok") { ok++; if (e.stage && e.duration_ms != null) (durs[e.stage] ||= []).push(e.duration_ms); }
    if (e.type === "error") err++;
  }
  const avgStageMs: Record<string, number> = {};
  for (const [s, arr] of Object.entries(durs)) avgStageMs[s] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

  const { count: pub } = await supabase.from("job_events").select("id", { count: "exact", head: true }).eq("type", "uploaded").gte("created_at", since);
  const { count: fail } = await supabase.from("job_events").select("id", { count: "exact", head: true }).eq("type", "dead_letter").gte("created_at", since);

  return {
    paused: state.paused,
    mode: state.mode,
    stageCounts,
    published24h: pub ?? 0,
    failed24h: fail ?? 0,
    deadLetter: stageCounts["dead_letter"] ?? 0,
    errorRate24h: ok + err ? +(err / (ok + err)).toFixed(3) : 0,
    avgStageMs,
    usdToday: +budget.usdToday.toFixed(2),
    youtubeUnitsToday: budget.youtubeUnitsToday,
    overBudget: budget.overBudget,
  };
}
