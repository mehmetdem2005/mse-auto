import { describe, it, expect } from "vitest";
import { runAgent, Blackboard, type Tool, type LlmTurnFn } from "../src/runtime.js";

const turn = (functionCalls: any[], text = "") => ({ text, functionCalls, modelContent: { role: "model", parts: [] }, usage: { promptTokens: 0, outputTokens: 0, totalTokens: 0 } });
const echo: Tool = { name: "echo", description: "", parameters: {}, run: async (args, ctx) => { ctx.blackboard.set("echoed", args.v); return { ok: true }; } };
const finish: Tool = { name: "finish", description: "", parameters: {}, run: async ({ result }) => ({ result }) };

describe("agent runtime (think→act→observe loop)", () => {
  it("executes a tool then finishes", async () => {
    let i = 0;
    const llm: LlmTurnFn = async () => (++i === 1 ? turn([{ name: "echo", args: { v: 42 } }]) : turn([{ name: "finish", args: { result: "done" } }]));
    const bb = new Blackboard(); const budget = { used: 0, max: 40 };
    const r = await runAgent({ role: "t", system: "", goal: "go", tools: [echo, finish], llm, blackboard: bb, budget });
    expect(r.result).toBe("done");
    expect(bb.get("echoed")).toBe(42);
    expect(r.trace.map((x) => x.tool)).toEqual(["echo", "finish"]);
  });

  it("stops at maxSteps if the agent never finishes (budget guard)", async () => {
    const llm: LlmTurnFn = async () => turn([{ name: "echo", args: { v: 1 } }]); // never finishes
    const bb = new Blackboard(); const budget = { used: 0, max: 40 };
    const r = await runAgent({ role: "t", system: "", goal: "go", tools: [echo, finish], llm, blackboard: bb, budget, maxSteps: 3 });
    expect(r.steps).toBe(3);
    expect(budget.used).toBe(3);
  });

  it("returns final text when the model stops calling tools", async () => {
    const llm: LlmTurnFn = async () => turn([], "final answer");
    const r = await runAgent({ role: "t", system: "", goal: "go", tools: [finish], llm, blackboard: new Blackboard(), budget: { used: 0, max: 40 } });
    expect(r.result).toBe("final answer");
  });
});
