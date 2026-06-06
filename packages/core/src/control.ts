/**
 * Control plane — "yönetilebilir". One switch to stop everything safely (incident, runaway
 * cost, policy scare), plus operating modes. The worker checks this every tick; the dashboard
 * flips it. Nothing is ever lost: paused jobs simply wait.
 */
import { supabase } from "./supabase.js";
import { logEvent } from "./events.js";

export type Mode = "run" | "draft_only" | "dry_run";
export interface SystemState { paused: boolean; mode: Mode; reason: string | null; updated_at: string; }

export async function getState(): Promise<SystemState> {
  const { data } = await supabase.from("system_state").select("*").eq("id", 1).single();
  return data ?? { paused: false, mode: "run", reason: null, updated_at: new Date().toISOString() };
}

export async function pause(reason: string) {
  await supabase.from("system_state").update({ paused: true, reason, updated_at: new Date().toISOString() }).eq("id", 1);
  await logEvent({ type: "control_pause", data: { reason } });
}

export async function resume() {
  await supabase.from("system_state").update({ paused: false, reason: null, updated_at: new Date().toISOString() }).eq("id", 1);
  await logEvent({ type: "control_resume" });
}

export async function setMode(mode: Mode) {
  await supabase.from("system_state").update({ mode, updated_at: new Date().toISOString() }).eq("id", 1);
}

/** Throw if the system is paused (the runner catches this and idles cleanly). */
export async function assertRunning() {
  const s = await getState();
  if (s.paused) throw new Error(`System paused: ${s.reason ?? "manual"}`);
  return s;
}
