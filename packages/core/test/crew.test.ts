import { describe, it, expect } from "vitest";
import { selectRoles, managerPlan, ROLES } from "../src/crew.js";
import { ToolRegistry, composeTool } from "../src/toolregistry.js";
import { SharedSandbox, AgentSandbox, Cache } from "../src/sandbox.js";
import { evaluate } from "../src/policy.js";
import { auditModules } from "../src/audit.js";
import { governor, GEMINI_FREE } from "../src/ratelimitprofile.js";
import { fetchTranscript } from "../src/competitor.js";
import type { Tool } from "../src/runtime.js";

const noop: Tool = { name: "x", description: "", parameters: {}, run: async () => ({ result: "ok" }) };

describe("v0.8 crew + dynamic tools + sandboxes + policy + audit + governor", () => {
  it("manager always includes manager+compliance and orders the chain", () => {
    const roles = selectRoles("rakip analizi ve senaryo").map((r) => r.id);
    expect(roles).toContain("manager"); expect(roles).toContain("compliance");
    expect(roles).toContain("competitor_analyst"); expect(roles).toContain("scriptwriter");
    const plan = managerPlan("rakip analizi ve senaryo");
    const idx = (id: string) => plan.findIndex((t) => t.id === id);
    if (idx("competitor_analyst") >= 0 && idx("scriptwriter") >= 0)
      expect(idx("competitor_analyst")).toBeLessThan(idx("scriptwriter")); // analysis before writing
  });

  it("ToolRegistry grows at runtime and scopes per role", () => {
    const reg = new ToolRegistry([noop]);
    expect(reg.size()).toBe(1);
    reg.register(composeTool({ name: "compare_competitors", description: "d" }, async () => ({ result: "r" })));
    expect(reg.size()).toBe(2);
    expect(reg.for(["*"]).length).toBe(2);
    expect(reg.for(["compare_competitors"]).map((t) => t.name)).toEqual(["compare_competitors"]);
  });

  it("AgentSandbox isolates namespaces; Cache expires", async () => {
    const store = new Map<string, any>();
    const a = new AgentSandbox("a", store), b = new AgentSandbox("b", store);
    a.set("k", 1); b.set("k", 2);
    expect(a.get("k")).toBe(1); expect(b.get("k")).toBe(2);
    expect(a.keys()).toEqual(["k"]);   // does not see b's key
    const c = new Cache(1); c.set("x", 9);
    await new Promise((r) => setTimeout(r, 5));
    expect(c.get("x")).toBeUndefined();
  });

  it("policy engine flags violations", () => {
    const bad = evaluate({ script: { description: "no tag" }, uploadsToday: 5, maxPerDay: 2 }, ["disclosure", "daily_cap"]);
    expect(bad.ok).toBe(false);
    expect(bad.violations.map((v) => v.id).sort()).toEqual(["daily_cap", "disclosure"]);
    const ok = evaluate({ script: { description: "yapay zeka ile üretildi" }, uploadsToday: 0, maxPerDay: 2 }, ["disclosure", "daily_cap"]);
    expect(ok.ok).toBe(true);
  });

  it("auditor flags oversized modules and missing tests", () => {
    const flags = auditModules([{ path: "src/big.ts", lines: 900, hasTest: false }, { path: "src/ok.ts", lines: 50, hasTest: true }], { maxLines: 400 });
    const paths = flags.map((f) => f.path);
    expect(paths).toContain("src/big.ts");
    expect(flags.find((f) => f.path === "src/big.ts" && /parçala|split/i.test(f.suggestion))).toBeTruthy();
  });

  it("governor derives safe parallelism + spacing from a rate profile", () => {
    const g = governor(GEMINI_FREE.reasoning, 8); // rpm 5
    expect(g.maxParallel).toBe(2);                 // floor(5/2)
    expect(g.minIntervalMs).toBe(Math.ceil(60000 / 5) + 1);
  });

  it("fetchTranscript parses timedtext xml", async () => {
    const f = async () => ({ ok: true, text: async () => "<transcript><text start='0'>Hello</text><text start='1'>world &amp; more</text></transcript>" });
    const t = await fetchTranscript("vid", f as any);
    expect(t).toContain("Hello"); expect(t).toContain("world & more");
  });
});
