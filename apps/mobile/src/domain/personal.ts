/**
 * Arketip-B cihaz-üstü değerlendirici (ADR-015).
 * ⚠️ Bu dosya backend `apps/backend/src/domain/personal.ts` ile SENKRON kalmalı:
 * `evaluateCriterion` + `haversineKm` mantığı BİREBİR aynıdır. (Backend zod ile
 * şema doğrular; burada bağımlılıksız manuel `parseEventFacts` kullanılır.)
 * Gizlilik değişmezi: kişisel kriter cihazda tutulur, değerlendirme cihazda çalışır;
 * kriter sunucuya ASLA gitmez. Sunucu yalnız kamusal `EventFacts` teslim eder.
 */

export interface EventFacts {
  geo?: { lat: number; lng: number };
  numeric?: number;
  numericKind?: string;
  currency?: string;
  text?: string;
}

export type PersonalCriterion =
  | { kind: "geo_radius"; lat: number; lng: number; radiusKm: number }
  | { kind: "numeric_below"; threshold: number; currency?: string }
  | { kind: "numeric_above"; threshold: number; currency?: string }
  | { kind: "keyword"; anyOf: string[] };

export interface EvalResult {
  matched: boolean;
  reason: string;
}

const EARTH_KM = 6371;
const rad = (d: number): number => (d * Math.PI) / 180;

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function evaluateCriterion(criterion: PersonalCriterion, facts: EventFacts): EvalResult {
  switch (criterion.kind) {
    case "geo_radius": {
      if (!facts.geo) return { matched: false, reason: "veri yok: konum" };
      const d = haversineKm(criterion, facts.geo);
      return {
        matched: d <= criterion.radiusKm,
        reason: `mesafe ${d.toFixed(1)}km / eşik ${criterion.radiusKm}km`,
      };
    }
    case "numeric_below":
    case "numeric_above": {
      if (facts.numeric === undefined) return { matched: false, reason: "veri yok: sayısal" };
      if (criterion.currency && facts.currency && criterion.currency !== facts.currency) {
        return {
          matched: false,
          reason: `para birimi uyumsuz: ${facts.currency}≠${criterion.currency}`,
        };
      }
      const below = criterion.kind === "numeric_below";
      const ok = below
        ? facts.numeric <= criterion.threshold
        : facts.numeric >= criterion.threshold;
      return {
        matched: ok,
        reason: `${facts.numeric} ${below ? "≤" : "≥"} ${criterion.threshold}`,
      };
    }
    case "keyword": {
      if (!facts.text) return { matched: false, reason: "veri yok: metin" };
      const t = facts.text.toLocaleLowerCase("tr");
      const hit = criterion.anyOf.find((k) => t.includes(k.toLocaleLowerCase("tr")));
      return hit
        ? { matched: true, reason: `anahtar kelime: ${hit}` }
        : { matched: false, reason: "anahtar kelime yok" };
    }
  }
}

/** Güvenilmez push verisini yapısal doğrular (zod'suz). Geçersizse null. */
export function parseEventFacts(raw: unknown): EventFacts | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const out: EventFacts = {};
  if (o.geo !== undefined) {
    const g = o.geo;
    if (typeof g !== "object" || g === null) return null;
    const gg = g as Record<string, unknown>;
    if (typeof gg.lat !== "number" || typeof gg.lng !== "number") return null;
    out.geo = { lat: gg.lat, lng: gg.lng };
  }
  if (o.numeric !== undefined) {
    if (typeof o.numeric !== "number") return null;
    out.numeric = o.numeric;
  }
  if (o.numericKind !== undefined) {
    if (typeof o.numericKind !== "string") return null;
    out.numericKind = o.numericKind;
  }
  if (o.currency !== undefined) {
    if (typeof o.currency !== "string") return null;
    out.currency = o.currency;
  }
  if (o.text !== undefined) {
    if (typeof o.text !== "string") return null;
    out.text = o.text;
  }
  return out;
}
