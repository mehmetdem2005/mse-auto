import { describe, it, expect } from "vitest";
import { plan, runSwarm } from "../src/orchestrator.js";
import type { Tool, LlmTurnFn } from "../src/runtime.js";

const finish: Tool = { name: "finish", description: "", parameters: {}, run: async ({ result }) => ({ result }) };
const turnFinish = (r: string) => ({ text: "", functionCalls: [{ name: "finish", args: { result: r } }], modelContent: { role: "model", parts: [] }, usage: { promptTokens: 0, outputTokens: 0, totalTokens: 0 } });
const lastText = (contents: any[]) => contents[0]?.parts?.[0]?.text ?? "";

describe("orchestrator", () => {
  it("plan() uses the planner output, falls back on error", async () => {
    const good = (async () => ({ text: JSON.stringify({ tasks: [{ id: "a", goal: "x" }] }), functionCalls: [], grounding: [], usage: { promptTokens: 0, outputTokens: 0, totalTokens: 0 }, raw: {} })) as any;
    expect((await plan("topic", good)).map((t) => t.id)).toEqual(["a"]);
    const bad = (async () => { throw new Error("nope"); }) as any;
    expect((await plan("topic", bad)).length).toBeGreaterThanOrEqual(3); // DEFAULT_PLAN
  });

  it("runs the DAG respecting dependencies", async () => {
    const llm: LlmTurnFn = async ({ contents }) => turnFinish("ok:" + lastText(contents).slice(0, 6));
    const tasks = [
      { id: "A", goal: "AAA", depends_on: [] },
      { id: "B", goal: "BBB", depends_on: ["A"] },
      { id: "C", goal: "CCC", depends_on: ["A"] },
    ];
    const { completed, failed, trace } = await runSwarm({ topic: "t", tasks, llmTurn: llm, tools: [finish] });
    expect(failed).toEqual([]);
    expect(completed.sort()).toEqual(["A", "B", "C"]);
    const okOrder = trace.filter((t) => t.ok).map((t) => t.id);
    expect(okOrder.indexOf("A")).toBeLessThan(okOrder.indexOf("B")); // A before its dependents
    expect(okOrder.indexOf("A")).toBeLessThan(okOrder.indexOf("C"));
  });

  it("supervisor retries a failing sub-task", async () => {
    let flakyHits = 0;
    const llm: LlmTurnFn = async ({ contents }) => {
      if (lastText(contents).includes("FLAKY") && ++flakyHits === 1) throw new Error("transient");
      return turnFinish("ok");
    };
    const { completed, failed, trace } = await runSwarm({ topic: "t", tasks: [{ id: "f", goal: "FLAKY task", depends_on: [] }], llmTurn: llm, tools: [finish], retries: 2 });
    expect(completed).toEqual(["f"]);
    expect(failed).toEqual([]);
    expect(trace.filter((t) => t.id === "f" && !t.ok).length).toBe(1); // one failed attempt
    expect(trace.filter((t) => t.id === "f" && t.ok).length).toBe(1);  // then a success
  });
});
