import { describe, it, expect } from "vitest";
import { consolidate, type Verdict } from "../src/agents.js";

const v = (p: Partial<Verdict>): Verdict => ({ role: "x", title: "X", critical: false, pass: true, score: 90, severity: "none", issues: [], required_fixes: [], ...p });

describe("chief-editor consolidation (≥5 reviewers, veto rules)", () => {
  it("approves when quorum of passes is met and no veto", () => {
    const d = consolidate([v({}), v({}), v({}), v({}), v({}), v({})], 5);
    expect(d.verdict).toBe("approve");
    expect(d.passCount).toBe(6);
  });

  it("a single critical reviewer can VETO (block) even if others pass", () => {
    const d = consolidate([
      v({ role: "policy", critical: true, pass: false, severity: "critical", required_fixes: ["remove claim"] }),
      v({}), v({}), v({}), v({}), v({}),
    ], 5);
    expect(d.verdict).toBe("blocked");
    expect(d.blockers).toContain("policy");
    expect(d.fixes).toContain("remove claim");
  });

  it("requests revise when below quorum but no veto", () => {
    const d = consolidate([
      v({ pass: true }), v({ pass: true }), v({ pass: true }),
      v({ role: "retention", pass: false, severity: "major", required_fixes: ["stronger hook"] }),
      v({ role: "editorial", pass: false, severity: "major", required_fixes: ["add angle"] }),
      v({ role: "language", pass: false, severity: "minor", required_fixes: ["fix grammar"] }),
    ], 5);
    expect(d.verdict).toBe("revise");
    expect(d.fixes).toEqual(expect.arrayContaining(["stronger hook", "add angle", "fix grammar"]));
  });
});
