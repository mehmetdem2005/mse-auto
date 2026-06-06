/** Dynamic UI panels — the agent writes arbitrary tables that the dashboard renders on demand. [v0.7] */
import { supabase } from "./supabase.js";
import { log } from "./logger.js";

export interface Panel { key: string; title: string; columns: string[]; rows: (string | number)[][]; }

export async function writePanel(p: Panel) {
  try {
    await supabase.from("panels").upsert({ key: p.key, title: p.title, columns: p.columns, rows: p.rows, updated_at: new Date().toISOString() });
  } catch (e) { log.debug("panel write failed", { err: String(e) }); }
}
export async function listPanels(): Promise<Panel[]> {
  try { const { data } = await supabase.from("panels").select("*").order("updated_at", { ascending: false }); return (data ?? []) as any; }
  catch { return []; }
}
