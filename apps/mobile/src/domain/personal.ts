/**
 * Tespit "olguları" (EventFacts) — kamusal, makine-değerlendirilebilir veri.
 * Feed/detay ekranlarında okunur rozetlere çevrilir (konum/sayısal/metin).
 * (ADR-094: cihaz-içi "kişisel kriter" değerlendirici kaldırıldı; EventFacts kaldı.)
 */

export interface EventFacts {
  geo?: { lat: number; lng: number };
  numeric?: number;
  numericKind?: string;
  currency?: string;
  text?: string;
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
