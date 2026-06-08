import { z } from "zod";

/**
 * Arketip-B (ADR-015) çekirdeği: kişisel kriter × kamusal olay facts → eşleşme.
 * Bu modül SAF mantıktır ve gizlilik değişmezinin temelidir: kriterler cihazda
 * tutulur ve değerlendirme cihazda çalışır. Sunucu yalnız kamusal `EventFacts`
 * üretir/teslim eder; kriteri ASLA görmez. Aynı mantık mobilde aynen kullanılır.
 */

// --- Kamusal olay facts (tespit hattının ürettiği yapılı veri; PII'siz) ---
export const eventFactsSchema = z.object({
  geo: z
    .object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
    .optional(),
  numeric: z.number().optional(), // genel skaler: fiyat (minor units), büyüklük, sıcaklık, sayı…
  numericKind: z.string().optional(), // etiket: "price" | "magnitude" | …
  currency: z.string().optional(),
  text: z.string().optional(), // keyword eşleştirme için (başlık/açıklama)
});
export type EventFacts = z.infer<typeof eventFactsSchema>;

// --- Kişisel kriter (cihazda tutulur; sunucuya gitmez) ---
export const personalCriterionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("geo_radius"),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    radiusKm: z.number().positive(),
  }),
  z.object({
    kind: z.literal("numeric_below"),
    threshold: z.number(),
    currency: z.string().optional(),
  }),
  z.object({
    kind: z.literal("numeric_above"),
    threshold: z.number(),
    currency: z.string().optional(),
  }),
  z.object({ kind: z.literal("keyword"), anyOf: z.array(z.string().min(1)).min(1) }),
]);
export type PersonalCriterion = z.infer<typeof personalCriterionSchema>;

export interface EvalResult {
  matched: boolean;
  reason: string;
}

const EARTH_KM = 6371;
const rad = (d: number): number => (d * Math.PI) / 180;

/** İki nokta arası büyük-daire mesafesi (km). */
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

/** Kriteri kamusal facts'e karşı değerlendirir. Gerekli boyut yoksa eşleşmez (+sebep). */
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
      // Türkçe case-folding (İ→i, I→ı) + İ'nin birleşik-nokta sorununu da çözer.
      const t = facts.text.toLocaleLowerCase("tr");
      const hit = criterion.anyOf.find((k) => t.includes(k.toLocaleLowerCase("tr")));
      return hit
        ? { matched: true, reason: `anahtar kelime: ${hit}` }
        : { matched: false, reason: "anahtar kelime yok" };
    }
  }
}
