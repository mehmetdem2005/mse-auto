import { describe, it, expect } from "vitest";
import { shouldRevert } from "../src/canary.js";
import { getActivePrompt, _clearPromptCache } from "../src/promptlab.js";
import { produceViaCrew } from "../src/orchestrator.js";
import { defaultTools } from "../src/tools.js";

describe("v1.0 prompt-swap + canary + crew production path", () => {
  it("canary.shouldRevert respects the watch window and delta", () => {
    const future = new Date(Date.now() + 60000).toISOString();
    const past = new Date(Date.now() - 60000).toISOString();
    expect(shouldRevert({ baselineErrorRate: 0.1, watchUntil: future }, 0.9)).toBe(false); // still watching
    expect(shouldRevert({ baselineErrorRate: 0.1, watchUntil: past }, 0.4)).toBe(true);     // regressed
    expect(shouldRevert({ baselineErrorRate: 0.1, watchUntil: past }, 0.15)).toBe(false);   // within delta
  });

  it("getActivePrompt returns the fallback when none stored, and caches it", async () => {
    _clearPromptCache();
    const v = await getActivePrompt("nonexistent_prompt_x", "FALLBACK");
    expect(v).toBe("FALLBACK");
    const v2 = await getActivePrompt("nonexistent_prompt_x", "DIFFERENT"); // cached → still FALLBACK
    expect(v2).toBe("FALLBACK");
  });

  it("produceViaCrew runs the manager→specialist chain and returns a crew-mode result", async () => {
    const llmTurn = (async () => ({ text: "", functionCalls: [{ name: "finish", args: { result: "ok" } }], modelContent: { role: "model", parts: [] }, usage: { promptTokens: 0, outputTokens: 0, totalTokens: 0 } })) as any;
    const gen = (async () => ({ text: JSON.stringify({ title: "T", hook: "H", narrationText: "N", beats: [], tags: [], description: "D", visualPrompts: [] }), usage: { totalTokens: 0 } })) as any;
    const getPrompt = (async (_n: string, fb: string) => fb) as any;
    const review = (async (script: any) => ({ script, report: { decision: { verdict: "approve", passCount: 5, reviewerCount: 5, score: 0.9, blockers: [] }, reviewerCount: 5, rounds: 1, reviews: [] } })) as any;
    const out = await produceViaCrew({ topic: "rakip analizi ve senaryo testi", styleId: "s1" }, { llmTurn, gen, getPrompt, review, tools: defaultTools() });
    expect(out.report.mode).toBe("crew");
    expect(out.script.title).toBe("T");
    expect((out.report as any).plan.length).toBeGreaterThan(0);
  });
});
