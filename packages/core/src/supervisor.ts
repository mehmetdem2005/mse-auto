/**
 * Self-healing supervisor — broad problem detection + remediation + memory repair.  [v0.7]
 * Runs periodically (worker autonomy task). Gathers signals, checks/repairs memory, and emits dynamic
 * panels for the UI. The actual code-change proposals are handled by selfimprove (opt-in, PR-gated).
 */
import { supabase } from "./supabase.js";
import { embed } from "./gemini.js";
import { recordUsage } from "./budget.js";
import { log } from "./logger.js";
import * as monitor from "./monitor.js";
import * as panels from "./panels.js";

export async function memoryHealth(): Promise<{ ok: boolean; issues: string[]; noEmbedding: number }> {
  const issues: string[] = [];
  let noEmbedding = 0;
  try {
    const { count } = await supabase.from("knowledge").select("id", { count: "exact", head: true }).is("embedding", null);
    noEmbedding = count ?? 0;
    if (noEmbedding > 0) issues.push(`${noEmbedding} bilgi satırı embedding'siz`);
  } catch (e) { issues.push(`bellek kontrolü hatası: ${String(e)}`); }
  return { ok: issues.length === 0, issues, noEmbedding };
}

export async function repairMemory(limit = 10): Promise<number> {
  try {
    const { data } = await supabase.from("knowledge").select("id, content").is("embedding", null).limit(limit);
    let fixed = 0;
    for (const row of data ?? []) {
      try { const [v] = await embed([row.content]); await recordUsage("embed", Math.ceil((row.content || "").length / 4)); await supabase.from("knowledge").update({ embedding: v }).eq("id", row.id); fixed++; } catch {}
    }
    if (fixed) log.info("repaired memory embeddings", { fixed });
    return fixed;
  } catch (e) { log.debug("repairMemory failed", { err: String(e) }); return 0; }
}

export async function superviseOnce(): Promise<{ signals: monitor.Signal[]; opportunities: monitor.Opportunity[]; memory: { ok: boolean; issues: string[] } }> {
  const signals = await monitor.gatherSignals();
  const mem = await memoryHealth();
  if (!mem.ok) { await repairMemory(); for (const i of mem.issues) signals.push({ kind: "memory", detail: i, severity: "warn" }); }
  const opportunities = await monitor.findOpportunities(signals);
  await monitor.storeOpportunities(opportunities);
  await panels.writePanel({ key: "signals", title: "Canlı Sinyaller", columns: ["önem", "tür", "ayrıntı"], rows: signals.map((s) => [s.severity, s.kind, s.detail]) });
  await panels.writePanel({ key: "opportunities", title: "Fırsatlar (sıralı)", columns: ["skor", "önem", "alan", "öneri"], rows: opportunities.map((o) => [o.score, o.severity, o.area, o.suggestion]) });
  return { signals, opportunities, memory: { ok: mem.ok, issues: mem.issues } };
}
