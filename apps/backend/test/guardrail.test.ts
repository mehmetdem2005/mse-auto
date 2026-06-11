import { describe, expect, it } from "vitest";
import { TimeoutError, withTimeout } from "../src/application/guardrail";

describe("guardrail withTimeout (ADR-076/A0)", () => {
  it("süre dolmadan biten iş normal döner", async () => {
    const out = await withTimeout(Promise.resolve(42), 1000, "x");
    expect(out).toBe(42);
  });

  it("süre dolan iş TimeoutError ile reddedilir", async () => {
    const slow = new Promise((r) => setTimeout(() => r("geç"), 100));
    await expect(withTimeout(slow, 20, "yavaş")).rejects.toBeInstanceOf(TimeoutError);
  });

  it("TimeoutError ms ve label taşır", async () => {
    const slow = new Promise((r) => setTimeout(r, 100));
    try {
      await withTimeout(slow, 15, "check(t1)");
      throw new Error("beklenen timeout atılmadı");
    } catch (e) {
      expect(e).toBeInstanceOf(TimeoutError);
      expect((e as TimeoutError).ms).toBe(15);
      expect((e as Error).message).toContain("check(t1)");
    }
  });
});
