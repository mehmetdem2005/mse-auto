import { describe, it, expect } from "vitest";
import { plan, planShort, shortsActions } from "../src/goap.js";
import { sequence, selector, inverter, parallel, cond, act, run } from "../src/behaviortree.js";
import { KDTree } from "../src/spatial.js";
import { shouldAcquire } from "../src/leader.js";
import { Ontology, seedDomain } from "../src/ontology.js";
import { encode, decode, AgentTaskZ, BidZ } from "../src/contract.js";

describe("v1.2 GOAP / BehaviorTree / Spatial / Leader / Ontology / Contract", () => {
  it("GOAP plans the Shorts pipeline and returns null for impossible goals", () => {
    const p = planShort();
    expect(p.map((a) => a.name)).toEqual(["research", "angle", "draft", "review", "render", "upload"]);
    expect(plan({ approved: true }, { published: true }, shortsActions())!.map((a) => a.name)).toEqual(["render", "upload"]); // starts mid-way
    expect(plan({}, { teleported: true }, shortsActions())).toBe(null); // no action produces it
  });

  it("Behavior Trees: sequence/selector/inverter/parallel semantics", async () => {
    const T = cond(() => true), F = cond(() => false);
    expect(await run(sequence(T, T), {})).toBe("success");
    expect(await run(sequence(T, F), {})).toBe("failure");
    expect(await run(selector(F, T), {})).toBe("success");
    expect(await run(inverter(F), {})).toBe("success");
    expect(await run(parallel(2, T, T, F), {})).toBe("success"); // 2 of 3 succeed, need 2
    let ran = false;
    await run(sequence(cond(() => true), act(() => { ran = true; })), {});
    expect(ran).toBe(true);
  });

  it("Spatial kd-tree finds nearest neighbors over vectors", () => {
    const tree = new KDTree([{ id: "a", vec: [0, 0] }, { id: "b", vec: [10, 10] }, { id: "c", vec: [1, 1] }]);
    expect(tree.nearest([0.2, 0.2], 1)[0].id).toBe("a");
    expect(tree.nearest([9, 9], 1)[0].id).toBe("b");
    const two = tree.nearest([0, 0], 2).map((r) => r.id);
    expect(two).toEqual(["a", "c"]); // a then c, sorted by distance
  });

  it("Leader election lease logic (pure)", () => {
    expect(shouldAcquire(null, "w1")).toBe(true);                                              // unheld
    expect(shouldAcquire({ holder: "w1", expires_at: new Date(Date.now() + 60000).toISOString() }, "w1")).toBe(true);  // ours → renew
    expect(shouldAcquire({ holder: "w2", expires_at: new Date(Date.now() + 60000).toISOString() }, "w1")).toBe(false); // held fresh by other
    expect(shouldAcquire({ holder: "w2", expires_at: new Date(Date.now() - 1000).toISOString() }, "w1")).toBe(true);   // expired → take over
  });

  it("Ontology triple store: add/query/neighbors", () => {
    const o = seedDomain();
    expect(o.query({ p: "improves" })[0]).toEqual({ s: "hook", p: "improves", o: "retention" });
    expect(o.neighbors("retention").length).toBeGreaterThanOrEqual(2);
    expect(o.size()).toBeGreaterThan(3);
    expect(new Ontology().add("x", "rel", "y").query({ s: "x" }).length).toBe(1);
  });

  it("Contract encode/decode round-trips and rejects invalid", () => {
    const task = { id: "1", skill: "render", input: { taskId: "1", role: "worker", parts: [{ type: "text", text: "hi" }] } };
    expect(decode(AgentTaskZ, encode(AgentTaskZ, task))).toEqual(task);
    expect(() => encode(BidZ, { worker: "w", cost: "x" } as any)).toThrow(); // type-safe validation
  });
});
