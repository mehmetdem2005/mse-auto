import { z } from "zod";

/**
 * Kamusal olay facts (tespit hattının ürettiği yapılı, PII'siz veri).
 * Feed/detay yüzeylerinde okunur olgulara çevrilir.
 * (ADR-094: cihaz-üstü "kişisel kriter" değerlendirici kaldırıldı; EventFacts kaldı.)
 */
export const eventFactsSchema = z.object({
  geo: z
    .object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
    .optional(),
  numeric: z.number().optional(), // genel skaler: fiyat (minor units), büyüklük, sıcaklık, sayı…
  numericKind: z.string().optional(), // etiket: "price" | "magnitude" | …
  currency: z.string().optional(),
  text: z.string().optional(),
});
export type EventFacts = z.infer<typeof eventFactsSchema>;
