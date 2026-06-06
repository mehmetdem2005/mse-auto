import { describe, it, expect } from "vitest";
import { limiter } from "../src/ratelimit.js";

describe("rate limiter (+1ms pacing)", () => {
  it("paces to floor(60000/RPM)+1 ms between calls", async () => {
    // youtube-write default rpm=6 → min interval = floor(60000/6)+1 = 10001ms.
    // First acquire is immediate; measure the WAIT injected on the second.
    process.env.RATE_LIMITS_JSON = JSON.stringify({ "test-fast": { rpm: 600 } }); // 100ms+1
    // 600 rpm → floor(60000/600)+1 = 101ms
    const t0 = Date.now();
    await limiter.acquire("test-fast");
    const afterFirst = Date.now() - t0;
    const t1 = Date.now();
    await limiter.acquire("test-fast");
    const gap = Date.now() - t1;
    expect(afterFirst).toBeLessThan(50);          // first call not delayed
    expect(gap).toBeGreaterThanOrEqual(100);      // second paced by ~101ms
  }, 20000);

  it("throws RateLimitExceeded when the daily cap is hit", async () => {
    process.env.RATE_LIMITS_JSON = JSON.stringify({ "test-day": { rpm: 6000, rpd: 1 } });
    await limiter.acquire("test-day");            // 1st ok
    await expect(limiter.acquire("test-day")).rejects.toThrow(/Rate limit \(rpd\)/);
  }, 20000);
});
