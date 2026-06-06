import { describe, it, expect } from "vitest";
import { withRetry, withTimeout, CircuitBreaker, FatalError, isRateLimit } from "../src/reliability.js";

describe("reliability primitives", () => {
  it("withRetry retries then succeeds", async () => {
    let n = 0;
    const r = await withRetry(async () => { if (++n < 3) throw new Error("flaky"); return "ok"; }, { attempts: 5, baseMs: 1 });
    expect(r).toBe("ok"); expect(n).toBe(3);
  });

  it("withRetry does not retry FatalError", async () => {
    let n = 0;
    await expect(withRetry(async () => { n++; throw new FatalError("bad input"); }, { attempts: 5, baseMs: 1 })).rejects.toThrow("bad input");
    expect(n).toBe(1);
  });

  it("withTimeout rejects slow ops", async () => {
    await expect(withTimeout(() => new Promise((r) => setTimeout(r, 50)), 10, "slow")).rejects.toThrow(/timed out/);
  });

  it("CircuitBreaker opens after threshold", async () => {
    const cb = new CircuitBreaker("t", 2, 1000);
    const boom = () => cb.run(async () => { throw new Error("x"); });
    await expect(boom()).rejects.toThrow("x");
    await expect(boom()).rejects.toThrow("x");      // now open
    await expect(boom()).rejects.toThrow(/circuit t open/);
  });

  it("detects rate-limit errors", () => {
    expect(isRateLimit({ status: 429 })).toBe(true);
    expect(isRateLimit(new Error("RESOURCE_EXHAUSTED: quota"))).toBe(true);
    expect(isRateLimit(new Error("normal failure"))).toBe(false);
  });

  it("retries rate-limited calls then succeeds", async () => {
    let n = 0;
    const r = await withRetry(async () => { if (++n < 2) { const e: any = new Error("RESOURCE_EXHAUSTED"); e.status = 429; throw e; } return "ok"; }, { attempts: 3, baseMs: 1 });
    expect(r).toBe("ok"); expect(n).toBe(2);
  }, 20000);
});
