/**
 * Agent runtime — a real tool-using think→act→observe loop.  [v0.5]
 *
 * This is the architectural piece my earlier "review board" lacked, and the thing Kimi's
 * Agent Swarm actually does: a sub-agent reasons, proposes a tool call, the APP executes &
 * validates it, the observation is fed back, and the loop continues until the agent finishes
 * or the step budget runs out. The LLM step is injectable so the loop logic is unit-testable
 * with a fake model (the orchestration is deterministic; the model is the quality ceiling).
 *
 * Honest scope: tools are a small, SAFE set (RAG, grounded web research, memory, a shared
 * blackboard) — no code execution, no filesystem, no arbitrary network. This is a bounded,
 * task-specific swarm, not Kimi's open-ended 300-agent / 4000-step autonomous swarm.
 */
import type { AgentTurn } from "./gemini.js";
import { log } from "./logger.js";

export class Blackboard {
  private m = new Map<string, any>();
  set(k: string, v: any) { this.m.set(k, v); }
  get(k: string) { return this.m.get(k); }
  has(k: string) { return this.m.has(k); }
  all() { return Object.fromEntries(this.m); }
}

export interface ToolCtx { blackboard: Blackboard; jobId?: string; }
export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;       // JSON schema for the args
  run: (args: any, ctx: ToolCtx) => Promise<any>;
}

export interface StepBudget { used: number; max: number; }
/** Injectable model step — Gemini-backed in prod, a fake in tests. */
export type LlmTurnFn = (args: { system?: string; contents: any[]; functions: any[] }) => Promise<AgentTurn>;

export interface AgentResult { result: any; steps: number; trace: { tool: string; ok: boolean }[]; }

/** Run one tool-using agent to completion (or until its step / global budget runs out). */
export async function runAgent(opts: {
  role: string;
  system: string;
  goal: string;
  tools: Tool[];
  llm: LlmTurnFn;
  blackboard: Blackboard;
  budget: StepBudget;
  maxSteps?: number;
  jobId?: string;
}): Promise<AgentResult> {
  const fnDecls = opts.tools.map((t) => ({ name: t.name, description: t.description, parameters: t.parameters }));
  const contents: any[] = [{ role: "user", parts: [{ text: opts.goal }] }];
  const trace: { tool: string; ok: boolean }[] = [];
  const maxSteps = opts.maxSteps ?? 8;
  let steps = 0;

  while (steps < maxSteps && opts.budget.used < opts.budget.max) {
    steps++; opts.budget.used++;
    const turn = await opts.llm({ system: opts.system, contents, functions: fnDecls });
    contents.push(turn.modelContent);

    if (!turn.functionCalls?.length) return { result: turn.text, steps, trace }; // final answer

    const responses: any[] = [];
    for (const fc of turn.functionCalls) {
      const tool = opts.tools.find((t) => t.name === fc.name);
      let out: any, ok = true;
      try {
        if (!tool) { ok = false; out = { error: `unknown tool ${fc.name}` }; }
        else out = await tool.run(fc.args ?? {}, { blackboard: opts.blackboard, jobId: opts.jobId });
      } catch (e: any) { ok = false; out = { error: String(e?.message || e) }; }
      trace.push({ tool: fc.name, ok });
      log.debug("agent tool", { role: opts.role, tool: fc.name, ok });
      if (fc.name === "finish" && ok) return { result: out?.result ?? out, steps, trace };
      responses.push({ functionResponse: { name: fc.name, response: typeof out === "object" ? out : { value: out } } });
    }
    contents.push({ role: "user", parts: responses });
  }
  return { result: opts.blackboard.get("__result__") ?? null, steps, trace }; // budget exhausted
}
