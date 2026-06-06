import { describe, it, expect } from "vitest";
import { planDay } from "../src/scheduler.js";

const cfg = {
  timezone: "Europe/Istanbul", daytimeStartHour: 9, daytimeEndHour: 21,
  maxPerDay: 4, minSpacingMinutes: 120, seed: 1337, requireHumanApproval: true, language: "tr",
};
const day = new Date("2026-06-10T00:00:00Z");

describe("seeded daytime scheduler", () => {
  it("is deterministic for the same (seed, date)", () => {
    const a = planDay(cfg as any, day, 3).map((s) => s.iso);
    const b = planDay(cfg as any, day, 3).map((s) => s.iso);
    expect(a).toEqual(b);
  });

  it("changes when the seed changes", () => {
    const a = planDay(cfg as any, day, 3).map((s) => s.iso);
    const b = planDay({ ...cfg, seed: 9999 } as any, day, 3).map((s) => s.iso);
    expect(a).not.toEqual(b);
  });

  it("keeps slots inside the daytime window (local hours)", () => {
    const slots = planDay(cfg as any, day, 4);
    for (const s of slots) {
      const h = new Date(s.iso).toLocaleString("en-US", { timeZone: cfg.timezone, hour: "2-digit", hour12: false });
      const hour = Number(h);
      expect(hour).toBeGreaterThanOrEqual(cfg.daytimeStartHour);
      expect(hour).toBeLessThanOrEqual(cfg.daytimeEndHour);
    }
  });

  it("respects minimum spacing", () => {
    const slots = planDay(cfg as any, day, 3).map((s) => +new Date(s.iso)).sort((a, b) => a - b);
    for (let i = 1; i < slots.length; i++) {
      expect((slots[i] - slots[i - 1]) / 60000).toBeGreaterThanOrEqual(cfg.minSpacingMinutes - 1);
    }
  });
});
