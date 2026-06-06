/**
 * Dynamic tool registry + runtime synthesis ("the spark").  [v0.8]
 * Research (OpenSage/Yunjue): agents synthesize NEW tools at runtime via meta-tools — generate metadata
 * (+ recipe), the runtime VALIDATES and REGISTERS them into the active set; capability gaps trigger a
 * Tool-Developer. Tools are NOT a fixed list: the registry grows. Safe composition (no eval) here;
 * code-level tools go through the PR self-improve pipeline. Tools are scoped per role (whitelist).
 */
import { generate, MODELS } from "./gemini.js";
import { recordUsage } from "./budget.js";
import { supabase } from "./supabase.js";
import { log } from "./logger.js";
import type { Tool } from "./runtime.js";

export class ToolRegistry {
  private tools = new Map<string, Tool>();
  constructor(initial: Tool[] = []) { for (const t of initial) this.tools.set(t.name, t); }
  register(t: Tool) { this.tools.set(t.name, t); return this; }
  has(n: string) { return this.tools.has(n); }
  get(n: string) { return this.tools.get(n); }
  list() { return [...this.tools.values()]; }
  size() { return this.tools.size; }
  /** Scope to a role's whitelist ('*' = all). */
  for(scope: string[]): Tool[] { return scope.includes("*") ? this.list() : this.list().filter((t) => scope.includes(t.name)); }
}

/** Compose a NEW tool at runtime from a validated spec + a safe run fn (no code-gen, no eval). */
export function composeTool(spec: { name: string; description: string; parameters?: any }, run: Tool["run"]): Tool {
  return { name: spec.name, description: spec.description, parameters: spec.parameters ?? {}, run };
}

const TOOLSPEC_SCHEMA = { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, parameters: { type: "object" }, recipe: { type: "string" } }, required: ["name", "description"] };

/** Meta-tool: propose a new tool spec for a capability gap (validated before registration). */
export async function synthesizeToolSpec(gap: string, existing: string[], gen = (async (a: any) => generate({ model: MODELS.reasoning, ...a }))): Promise<{ name: string; description: string; parameters?: any; recipe?: string } | null> {
  try {
    const r = await gen({ system: "Bir yetenek boşluğu için YENİ bir tool TANIMI öner; mevcut güvenli primitiflerden türetilebilir olmalı. SADECE JSON.", prompt: `BOŞLUK: ${gap}\nMEVCUT TOOL'LAR: ${existing.join(", ")}`, responseSchema: TOOLSPEC_SCHEMA });
    await recordUsage("reasoning", r.usage?.totalTokens || 1);
    const s = JSON.parse(r.text);
    return s?.name ? s : null;
  } catch (e) { log.debug("synthesizeToolSpec failed", { err: String(e) }); return null; }
}

export async function recordTool(spec: { name: string; description: string }) {
  try { await supabase.from("tools_registry").upsert({ name: spec.name, description: spec.description, created_at: new Date().toISOString() }); } catch {}
}
