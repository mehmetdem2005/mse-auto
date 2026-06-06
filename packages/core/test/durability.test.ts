import { describe, it, expect } from "vitest";
import { replan, runSwarm } from "../src/orchestrator.js";
import { MemoryCheckpointer } from "../src/checkpoint.js";
import { withSpan } from "../src/tracing.js";
import { Blackboard, type Tool, type LlmTurnFn } from "../src/runtime.js";

const finish: Tool = { name: "finish", description: "", parameters: {}, run: async ({ result }) => ({ result }) };
const turnFinish = () => ({ text: "", functionCalls: [{ name: "finish", args: { result: "ok" } }], modelContent: { role: "model", parts: [] }, usage: { promptTokens: 0, outputTokens: 0, totalTokens: 0 } });

describe("v0.6 durability + replan + tracing", () => {
  it("replan() returns the planner's new tasks", async () => {
    const gen = (async () => ({ text: JSON.stringify({ tasks: [{ id: "retry-facts", goal: "alt yaklaşım" }] }), usage: { totalTokens: 0 } })) as any;
    const tasks = await replan("topic", ["facts"], "failed", gen);
    expect(tasks.map((t) => t.id)).toEqual(["retry-facts"]);
  });

  it("runSwarm resumes: skipped tasks are not re-run, dependents still run", async () => {
    let calls = 0;
    const llm: LlmTurnFn = async () => { calls++; return turnFinish(); };
    const bb = new Blackboard(); bb.set("task:A", "seeded");
    const tasks = [{ id: "A", goal: "A", depends_on: [] }, { id: "B", goal: "B", depends_on: ["A"] }];
    const { completed, trace } = await runSwarm({ topic: "t", tasks, llmTurn: llm, tools: [finish], blackboard: bb, skip: ["A"] });
    expect(completed.sort()).toEqual(["A", "B"]);
    expect(trace.map((t) => t.id)).toEqual(["B"]);   // only B actually ran
    expect(calls).toBe(1);
  });

  it("MemoryCheckpointer round-trips and clears", async () => {
    const cp = new MemoryCheckpointer();
    await cp.save("r1", { plan: [{ id: "a", goal: "x" }], completed: ["a"], blackboard: { k: 1 }, status: "running" });
    const loaded = await cp.load("r1");
    expect(loaded?.completed).toEqual(["a"]);
    expect(loaded?.blackboard.k).toBe(1);
    await cp.clear("r1");
    expect(await cp.load("r1")).toBeNull();
  });

  it("withSpan is a no-op (and still returns the result) when disabled", async () => {
    const r = await withSpan({ traceId: "t", enabled: false }, "invoke_agent", "x", {}, async () => "done");
    expect(r).toBe("done");
  });
});
