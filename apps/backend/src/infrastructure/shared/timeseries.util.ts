import type { AdminTimeseriesData, AdminTimeseriesPoint } from "../../domain/billing";

/** UTC gün anahtarı (YYYY-MM-DD). */
export function dayKey(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toISOString().slice(0, 10);
}

/** `days` günlük (bugün dahil, eskiden yeniye) sıfır dolu kovalar. */
export function emptyBuckets(days: number): Map<string, AdminTimeseriesPoint> {
  const span = Math.max(1, Math.min(90, Math.trunc(days)));
  const map = new Map<string, AdminTimeseriesPoint>();
  const today = new Date();
  for (let i = span - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = dayKey(d);
    map.set(key, { date: key, checkRuns: 0, detections: 0, deliveries: 0 });
  }
  return map;
}

/** ISO başlangıç sınırı: serideki ilk günün 00:00:00 UTC'si. */
export function sinceIso(days: number): string {
  const span = Math.max(1, Math.min(90, Math.trunc(days)));
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - (span - 1));
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/** Kovaları toplayıp sözleşme DTO'suna çevirir. */
export function finalizeTimeseries(
  days: number,
  buckets: Map<string, AdminTimeseriesPoint>,
): AdminTimeseriesData {
  const points = [...buckets.values()];
  const totals = points.reduce(
    (acc, p) => {
      acc.checkRuns += p.checkRuns;
      acc.detections += p.detections;
      acc.deliveries += p.deliveries;
      return acc;
    },
    { checkRuns: 0, detections: 0, deliveries: 0 },
  );
  return { days: points.length, points, totals };
}

export function emptyTimeseries(days: number): AdminTimeseriesData {
  return finalizeTimeseries(days, emptyBuckets(days));
}
