import { describe, it, expect } from "vitest";
import { applyEdit, applyEdits } from "../src/patch.js";
import { optimizePrompt } from "../src/promptlab.js";
import { toOtlp } from "../src/otel.js";
import { validateTask, LocalA2ADispatcher } from "../src/a2a.js";
import { isAutoAllowed, decide, act, ACTIONS } from "../src/anomaly.js";
import { MergeQueue, canaryRegressed } from "../src/mergequeue.js";

describe("v0.9 surgical edit + GEPA + OTel + A2A + anomaly + merge-queue", () => {
  it("patch: exact + whitespace-flexible apply", () => {
    expect(applyEdit("const a = 1;", { find: "= 1", replace: "= 2" }).content).toBe("const a = 2;");
    // file has tabs/extra spaces vs the find's single spaces → ws-flexible still matches
    expect(applyEdit("if (x)    return\t0;", { find: "if (x) return 0;", replace: "if (x) return 1;" }).content).toBe("if (x) return 1;");
  });
  it("patch: rejects ambiguous and not-found (no blind write)", () => {
    expect(applyEdit("a; a; a;", { find: "a;", replace: "b;" }).error).toMatch(/belirsiz/);
    expect(applyEdit("hello", { find: "zzz", replace: "q" }).error).toMatch(/bulunamad/);
    const multi = applyEdits("x=1; y=2;", [{ find: "x=1", replace: "x=9" }, { find: "y=2", replace: "y=8" }]);
    expect(multi.ok).toBe(true); expect(multi.content).toBe("x=9; y=8;"); expect(multi.applied).toBe(2);
  });

  it("GEPA optimizePrompt keeps candidate only if it scores higher", async () => {
    const judge = (async (s: any) => ({ score: s.output === "CANDIDATE" ? 0.9 : 0.5, asi: "weak hook" })) as any;
    const propose = (async () => ({ prompt: "better", rationale: "r" })) as any;
    const render = (async (p: string) => (p === "better" ? "CANDIDATE" : "CUR")) as any;
    const evalSet = [{ input: "i1", output: "CUR" }, { input: "i2", output: "CUR" }, { input: "i3", output: "CUR" }];
    const up = await optimizePrompt("scriptwriter", "old", evalSet, "rubric", { judge, propose, render });
    expect(up.improved).toBe(true); expect(up.prompt).toBe("better"); expect(up.after).toBeGreaterThan(up.before);

    const noRender = (async () => "CUR") as any;
    const down = await optimizePrompt("scriptwriter", "old", evalSet, "rubric", { judge, propose: (async () => ({ prompt: "worse" })) as any, render: noRender });
    expect(down.improved).toBe(false); expect(down.prompt).toBe("old");
  });

  it("OTel toOtlp maps spans to gen_ai.* attributes", () => {
    const o = toOtlp([{ trace_id: "trace_abc", data: { span_id: "span_1", parent_span_id: "span_0", "gen_ai.operation.name": "invoke_agent", name: "produce_short", status: "OK" } }]);
    const span = o.resourceSpans[0].scopeSpans[0].spans[0];
    expect(span.traceId.length).toBe(32); expect(span.name).toBe("produce_short");
    expect(span.attributes.some((a: any) => a.key === "gen_ai.operation.name")).toBe(true);
  });

  it("A2A validates tasks and dispatches by skill", async () => {
    expect(validateTask({ id: "1", skill: "write", input: { parts: [] } })).toBe(true);
    expect(validateTask({ id: "1" })).toBe(false);
    const d = new LocalA2ADispatcher().register("echo", async (t) => ({ taskId: t.id, role: "agent", parts: [{ type: "text", text: "ok" }] }));
    const res = await d.send({ id: "1", skill: "echo", input: { taskId: "1", role: "user", parts: [{ type: "text", text: "hi" }] } });
    expect(res.parts[0].text).toBe("ok");
    expect(d.card("me").skills[0].id).toBe("echo");
  });

  it("anomaly: low-risk auto-allowed, high-risk escalated; unknown → alert_only", async () => {
    expect(isAutoAllowed("takedown_video")).toBe(true);
    expect(isAutoAllowed("delete_data")).toBe(false);
    expect(ACTIONS.find((a) => a.id === "change_infra")!.risk).toBe("high");
    const unknown = await decide({ kind: "x", detail: "d", severity: "warn" }, (async () => ({ text: JSON.stringify({ action: "nuke_everything", rationale: "no" }), usage: { totalTokens: 0 } })) as any);
    expect(unknown.action).toBe("alert_only");           // unknown action coerced to safe default
    const high = await act({ action: "delete_data", rationale: "r" });
    expect(high.executed).toBe(false);                    // high-risk never auto-executed
  });

  it("merge-queue merges only green PRs; canary detects regression", async () => {
    const gh = { checksConclusion: async (sha: string) => (sha === "green" ? "success" : "failure"), mergePR: async () => ({}) } as any;
    const q = new MergeQueue(gh).enqueue({ number: 1, headSha: "green" }).enqueue({ number: 2, headSha: "red" });
    expect(await q.drain()).toEqual([1]);                  // only the green one merged
    expect(canaryRegressed({ errorRate: 0.1 }, { errorRate: 0.4 })).toBe(true);
    expect(canaryRegressed({ errorRate: 0.1 }, { errorRate: 0.12 })).toBe(false);
  });
});
