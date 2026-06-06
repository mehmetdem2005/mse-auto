import { describe, it, expect } from "vitest";
import { classifyRisk, submitImprovement } from "../src/selfimprove.js";
import { scoreOpportunity, rankOpportunities, type Opportunity } from "../src/monitor.js";
import { rateLimitWaitMs } from "../src/reliability.js";
import { GitHub } from "../src/github.js";

function mockGh() {
  const calls: { url: string; method: string }[] = [];
  const res = (status: number, body: any) => ({ ok: status < 300, status, json: async () => body, text: async () => JSON.stringify(body) });
  const f = async (url: any, init: any = {}) => {
    const u = String(url), m = init.method || "GET";
    calls.push({ url: u, method: m });
    if (u.includes("/git/ref/heads/")) return res(200, { object: { sha: "basesha" } });
    if (u.endsWith("/git/refs") && m === "POST") return res(201, {});
    if (u.includes("/contents/") && m === "GET") return res(404, {});
    if (u.includes("/contents/") && m === "PUT") return res(201, { content: {} });
    if (u.endsWith("/pulls") && m === "POST") return res(201, { number: 42, html_url: "https://gh/pr/42" });
    if (u.includes("/merge") && m === "PUT") return res(200, { merged: true });
    if (u.includes("/check-runs")) return res(200, { check_runs: [{ status: "completed", conclusion: "success" }] });
    return res(200, {});
  };
  return { gh: new GitHub({ token: "t", owner: "o", repo: "r", fetchImpl: f as any }), calls };
}

describe("v0.7 autonomy + self-improvement + rate-limit resume", () => {
  it("classifyRisk gates by path", () => {
    expect(classifyRisk(["docs/IMPROVEMENT-LOG.md"])).toBe("low");
    expect(classifyRisk(["packages/core/src/runtime.ts"])).toBe("medium");
    expect(classifyRisk(["packages/core/src/youtube.ts"])).toBe("high");        // forbidden
    expect(classifyRisk(["supabase/migrations/0007_x.sql"])).toBe("high");
  });

  it("ranks opportunities by score then severity", () => {
    const list: Opportunity[] = [
      { title: "a", area: "x", severity: "info", score: scoreOpportunity({ severity: "info" }), suggestion: "" },
      { title: "b", area: "y", severity: "crit", score: scoreOpportunity({ severity: "crit" }), suggestion: "" },
    ];
    expect(rankOpportunities(list)[0].title).toBe("b");
  });

  it("rateLimitWaitMs honors Retry-After, then resumeAt, then default", () => {
    expect(rateLimitWaitMs({ response: { headers: { get: (k: string) => (k === "retry-after" ? "30" : null) } } })).toBe(30000);
    const at = new Date(Date.now() + 5000).toISOString();
    expect(rateLimitWaitMs({ resumeAt: at })).toBeGreaterThan(3000);
    expect(rateLimitWaitMs({})).toBe(120000);
  });

  it("openChangePR creates branch, writes files, opens PR", async () => {
    const { gh, calls } = mockGh();
    const pr = await gh.openChangePR({ branch: "auto/x", title: "t", body: "b", files: [{ path: "docs/IMPROVEMENT-LOG.md", content: "hi" }], message: "m" });
    expect(pr.number).toBe(42);
    expect(calls.some((c) => c.url.endsWith("/git/refs") && c.method === "POST")).toBe(true);
    expect(calls.some((c) => c.url.includes("/contents/") && c.method === "PUT")).toBe(true);
    expect(calls.some((c) => c.url.endsWith("/pulls") && c.method === "POST")).toBe(true);
  });

  it("auto-merge ONLY when low-risk + green CI + opt-in", async () => {
    const ci = async () => "success" as const;
    const a = mockGh();
    const low = await submitImprovement(a.gh, { title: "t", rationale: "r", files: [{ path: "docs/IMPROVEMENT-LOG.md", content: "x" }] }, { autoMerge: true, waitForCi: ci });
    expect(low.risk).toBe("low"); expect(low.merged).toBe(true);

    const b = mockGh();
    const med = await submitImprovement(b.gh, { title: "t", rationale: "r", files: [{ path: "packages/core/src/runtime.ts", content: "x" }] }, { autoMerge: true, waitForCi: ci });
    expect(med.risk).toBe("medium"); expect(med.merged).toBe(false);   // not low-risk → human merges

    const c = mockGh();
    const off = await submitImprovement(c.gh, { title: "t", rationale: "r", files: [{ path: "docs/IMPROVEMENT-LOG.md", content: "x" }] }, { autoMerge: false, waitForCi: ci });
    expect(off.merged).toBe(false);   // opt-in off → human merges
  });
});
