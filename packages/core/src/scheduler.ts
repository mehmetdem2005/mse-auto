/**
 * Seeded daytime scheduler.
 *
 * Generates posting times that look organic (random within daytime hours) but are
 * fully DETERMINISTIC for a given (date, seed) – so the same seed always yields the
 * same plan, you can preview it, and it survives restarts. Respects a daytime window,
 * a per-day cap, and a minimum spacing between uploads.
 *
 * NOTE: This is legitimate scheduling jitter (spreading uploads across the day), NOT an
 * attempt to deceive YouTube's integrity systems. The cap is intentionally low — quality
 * over volume is what keeps a channel alive (PLAN.md §10/§11).
 */
import type { ChannelConfig, ScheduleSlot } from "./types.js";

/** mulberry32 – tiny deterministic PRNG. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable per-day seed = config seed mixed with the YYYYMMDD integer. */
function daySeed(seed: number, date: Date): number {
  const ymd =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  return (seed ^ Math.imul(ymd, 2654435761)) >>> 0;
}

/**
 * Build the publish slots for a single local day.
 * Returns ISO timestamps. `count` defaults to a random 1..maxPerDay (also seeded).
 */
export function planDay(
  cfg: ChannelConfig,
  date: Date,
  count?: number,
): ScheduleSlot[] {
  const rand = rng(daySeed(cfg.seed, date));
  const n = count ?? 1 + Math.floor(rand() * cfg.maxPerDay); // 1..maxPerDay
  const startMin = cfg.daytimeStartHour * 60;
  const endMin = cfg.daytimeEndHour * 60;
  const span = endMin - startMin;

  // Pick n minute-offsets, enforce min spacing, then sort.
  const picks: number[] = [];
  let guard = 0;
  while (picks.length < n && guard++ < 500) {
    const m = startMin + Math.floor(rand() * span);
    if (picks.every((p) => Math.abs(p - m) >= cfg.minSpacingMinutes)) picks.push(m);
  }
  picks.sort((a, b) => a - b);

  return picks.map((m) => {
    // Construct a local-time Date for the chosen minute, then emit ISO.
    const d = new Date(date);
    d.setHours(Math.floor(m / 60), m % 60, Math.floor(rand() * 60), 0);
    return { iso: localToISO(d, cfg.timezone) };
  });
}

/** Plan the next `days` days at once (used by the dashboard preview + the worker). */
export function planAhead(cfg: ChannelConfig, days = 7, from = new Date()): ScheduleSlot[] {
  const out: ScheduleSlot[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    out.push(...planDay(cfg, d));
  }
  return out;
}

/**
 * Convert a Date whose fields represent a wall-clock time in `tz` into a correct ISO instant.
 * Uses Intl to find the tz offset for that wall time. Good enough for scheduling.
 */
function localToISO(wall: Date, tz: string): string {
  const asUTC = Date.UTC(
    wall.getFullYear(), wall.getMonth(), wall.getDate(),
    wall.getHours(), wall.getMinutes(), wall.getSeconds(),
  );
  const tzDate = new Date(
    new Date(asUTC).toLocaleString("en-US", { timeZone: tz }),
  );
  const utcDate = new Date(new Date(asUTC).toLocaleString("en-US", { timeZone: "UTC" }));
  const offset = tzDate.getTime() - utcDate.getTime();
  return new Date(asUTC - offset).toISOString();
}
