import { describe, it, expect } from "vitest";
import { acl, isACL, reply } from "../src/acl.js";
import { Actor, ActorSystem } from "../src/actors.js";
import { award, allocate } from "../src/contractnet.js";
import { init, believe, desire, deliberate } from "../src/bdi.js";
import { can, grant } from "../src/authz.js";
import { complianceReport, STANDARDS } from "../src/standards.js";

describe("v1.1 agent/architecture standards", () => {
  it("FIPA ACL builds, validates, and replies with performatives", () => {
    const m = acl("request", "manager", "worker", { task: "render" }, { conversationId: "c1" });
    expect(isACL(m)).toBe(true);
    expect(() => acl("nonsense" as any, "a", "b", {})).toThrow();
    const r = reply(m, "propose", { cost: 3 });
    expect(r.sender).toBe("worker"); expect(r.receiver).toBe("manager"); expect(r.conversationId).toBe("c1");
  });

  it("Actor model: 60 actors process concurrently with no deadlock; one actor is sequential", async () => {
    const sys = new ActorSystem();
    const seen: string[] = [];
    for (let i = 0; i < 60; i++) sys.spawn<string>(`a${i}`, async (msg) => { seen.push(msg); });
    for (let i = 0; i < 60; i++) sys.tell(`a${i}`, `hi-${i}`);
    await sys.drainAll();
    expect(seen.length).toBe(60);

    let sum = 0; const order: number[] = [];
    const counter = new Actor<number>("counter", async (n) => { order.push(n); sum += n; });
    for (let i = 1; i <= 100; i++) counter.send(i);
    await counter.drain();
    expect(sum).toBe(5050);
    expect(order[0]).toBe(1); expect(order[99]).toBe(100); // strict FIFO, no interleave
  });

  it("Contract Net awards the best bid (confidence, then cost)", async () => {
    const res = award("t1", [{ worker: "w1", cost: 5, confidence: 0.6 }, { worker: "w2", cost: 2, confidence: 0.9 }, { worker: "w3", cost: 1, confidence: 0.9 }]);
    expect(res.winner).toBe("w3"); // ties on confidence → lowest cost
    const none = award("t2", [{ worker: "w1", cost: 1, confidence: 0 }]);
    expect(none.winner).toBe(null);
    const alloc = await allocate("t3", "render video", [
      { name: "fast", bid: () => ({ worker: "fast", cost: 1, confidence: 0.5 }) },
      { name: "good", bid: async () => ({ worker: "good", cost: 4, confidence: 0.95 }) },
    ]);
    expect(alloc.winner).toBe("good");
  });

  it("BDI deliberation commits only feasible desires to intentions", () => {
    let s = init({ hasFootage: true });
    s = believe(s, "budgetOk", false);
    s = desire(s, "render"); s = desire(s, "upload");
    const out = deliberate(s, (goal, b) => (goal === "upload" ? b.budgetOk : b.hasFootage));
    expect(out.intentions).toContain("render");   // hasFootage true
    expect(out.intentions).not.toContain("upload"); // budgetOk false
  });

  it("Zero-Trust authz is default-deny and grant-driven", () => {
    expect(can("incident_commander", "action:takedown_video")).toBe(true);
    expect(can("incident_commander", "action:delete_data")).toBe(false); // high-risk never granted
    expect(can("stranger", "action:alert_only")).toBe(false);            // unknown principal denied
    grant("auditor", "action:alert_only");
    expect(can("auditor", "action:alert_only")).toBe(true);
  });

  it("standards matrix reports honest counts (sum == total, none missing)", () => {
    const r = complianceReport();
    expect(r.implemented + r.partial + r.documented + r.na).toBe(r.total);
    expect(r.total).toBe(STANDARDS.length);
    expect(r.implemented).toBeGreaterThan(10);
    expect(r.gaps.every((g) => g.status === "partial")).toBe(true);
  });
});
