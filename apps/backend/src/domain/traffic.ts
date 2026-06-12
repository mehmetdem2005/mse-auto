/**
 * Trafik telemetrisi domain'i (ADR-091) — KİMLİKSİZ edinim sinyali.
 * P1/25012: kullanıcı kimliği, IP, user-agent, tam URL bu modele HİÇ girmez;
 * yalnız gün + kaynak türü + yönlendiren alan adı + utm + yol + dil + platform.
 */

export type TrafficSource = "site" | "app";
export type TrafficPlatform = "web" | "android" | "ios";

export interface TrafficEvent {
  /** UTC gün (YYYY-MM-DD) — sunucuda hesaplanır, istemciden alınmaz. */
  day: string;
  source: TrafficSource;
  /** Yönlendiren alan adı (kendi alanlarımız null'lanır). */
  ref: string | null;
  utm: string | null;
  path: string | null;
  lang: string | null;
  platform: TrafficPlatform | null;
}

export interface TrafficTopItem {
  key: string;
  count: number;
}
export interface TrafficBreakdown {
  total: number;
  refs: TrafficTopItem[];
  utms: TrafficTopItem[];
  paths: TrafficTopItem[];
  langs: TrafficTopItem[];
  platforms: TrafficTopItem[];
}
export interface TrafficSummary {
  days: { date: string; site: number; app: number }[];
  site: TrafficBreakdown;
  app: TrafficBreakdown;
}

export interface TrafficRepository {
  record(event: TrafficEvent): Promise<void>;
  /** Son `days` günün (bugün dahil) ham olayları — özet `summarizeTraffic` ile üretilir. */
  listSince(firstDay: string): Promise<TrafficEvent[]>;
}

/** UTC gün anahtarı. */
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Pencerenin ilk günü (bugün dahil `days` gün). */
export function windowStart(days: number, now: Date = new Date()): string {
  const d = new Date(now.getTime() - (days - 1) * 86_400_000);
  return dayKey(d);
}

function top(counter: Map<string, number>, limit: number): TrafficTopItem[] {
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}

/** Saf özetleyici — in-memory ve supabase repo'ları AYNI mantığı paylaşır (çift bakım yok). */
export function summarizeTraffic(
  events: TrafficEvent[],
  days: number,
  now: Date = new Date(),
): TrafficSummary {
  const series = new Map<string, { site: number; app: number }>();
  for (let i = days - 1; i >= 0; i--) {
    series.set(dayKey(new Date(now.getTime() - i * 86_400_000)), { site: 0, app: 0 });
  }
  const makeCounters = () => ({
    total: 0,
    refs: new Map<string, number>(),
    utms: new Map<string, number>(),
    paths: new Map<string, number>(),
    langs: new Map<string, number>(),
    platforms: new Map<string, number>(),
  });
  const acc = { site: makeCounters(), app: makeCounters() };

  for (const e of events) {
    const dayPoint = series.get(e.day);
    if (!dayPoint) continue; // pencere dışı
    dayPoint[e.source] += 1;
    const a = acc[e.source];
    a.total += 1;
    const bump = (m: Map<string, number>, v: string | null) => {
      if (v) m.set(v, (m.get(v) ?? 0) + 1);
    };
    bump(a.refs, e.ref);
    bump(a.utms, e.utm);
    bump(a.paths, e.path);
    bump(a.langs, e.lang);
    bump(a.platforms, e.platform);
  }

  const breakdown = (c: ReturnType<typeof makeCounters>): TrafficBreakdown => ({
    total: c.total,
    refs: top(c.refs, 8),
    utms: top(c.utms, 8),
    paths: top(c.paths, 8),
    langs: top(c.langs, 8),
    platforms: top(c.platforms, 4),
  });

  return {
    days: [...series.entries()].map(([date, v]) => ({ date, ...v })),
    site: breakdown(acc.site),
    app: breakdown(acc.app),
  };
}
