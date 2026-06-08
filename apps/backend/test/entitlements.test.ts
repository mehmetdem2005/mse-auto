import { describe, expect, it } from "vitest";
import { entitlementsFor, limitsFor } from "../src/domain/plan";

describe("plan entitlements (free vs pro)", () => {
  it("free: sunum özellikleri kapalı, limitler dar", () => {
    const e = entitlementsFor("free");
    expect(e.alarmChannel).toBe(false);
    expect(e.allSounds).toBe(false);
    expect(e.personalFilters).toBe(false);
    expect(e.maxActiveWatches).toBe(3);
    expect(e.minFrequencyMinutes).toBe(60);
  });

  it("pro: tüm sunum özellikleri açık, limitler geniş", () => {
    const e = entitlementsFor("pro");
    expect(e.alarmChannel).toBe(true);
    expect(e.allSounds).toBe(true);
    expect(e.personalFilters).toBe(true);
    expect(e.maxActiveWatches).toBe(100);
    expect(e.minFrequencyMinutes).toBe(5);
  });

  it("limitsFor, entitlements ile tutarlı", () => {
    for (const p of ["free", "pro"] as const) {
      const e = entitlementsFor(p);
      expect(limitsFor(p)).toEqual({
        maxActiveWatches: e.maxActiveWatches,
        minFrequencyMinutes: e.minFrequencyMinutes,
      });
    }
  });
});
