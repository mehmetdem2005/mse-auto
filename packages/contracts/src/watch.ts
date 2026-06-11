import { z } from "zod";

/** ADR-010: A = paylaşılabilir (shared), B = kişisel-değerlendirilen (personal). */
export const watchArchetypeSchema = z.enum(["shared", "personal"]);
export type WatchArchetype = z.infer<typeof watchArchetypeSchema>;

export const watchStatusSchema = z.enum(["active", "paused"]);
export type WatchStatus = z.infer<typeof watchStatusSchema>;

/**
 * Watcher oluşturma girdisi. `rawIntent` doğal dildir ve PII içerebilir →
 * P1 gereği dış hatta (arama/DeepSeek) ASLA gitmez; yalnızca kanonik sorgu gider.
 */
export const watchSourcePrefSchema = z.enum(["auto", "news", "official", "web"]);
export type WatchSourcePref = z.infer<typeof watchSourcePrefSchema>;

export const createWatchInputSchema = z.object({
  rawIntent: z.string().min(3).max(500),
  frequencyMinutes: z.number().int().min(1).max(1440),
  sourcePref: watchSourcePrefSchema.default("auto"),
});
export type CreateWatchInput = z.infer<typeof createWatchInputSchema>;

/** İstemciye dönen watcher gösterimi (kullanıcı-kapsamlı). */
export const watchSchema = z.object({
  id: z.string().min(1),
  rawIntent: z.string(),
  archetype: watchArchetypeSchema,
  frequencyMinutes: z.number().int(),
  status: watchStatusSchema,
  createdAt: z.iso.datetime(),
  /** Konunun resmî kaynak alanı (liste görünümünde kaynak etiketi; ADR-049). */
  authorityDomain: z.string().nullable().optional(),
  /** Konunun son kontrol zamanı (ADR-072) — kartta "son kontrol" nabzı. */
  lastCheckedAt: z.string().nullable().optional(),
  sourcePref: watchSourcePrefSchema.optional(),
});
export type Watch = z.infer<typeof watchSchema>;

/** Saklanan arama sonucu (kamusal web verisi; ADR-036). */
export const searchHitViewSchema = z.object({
  title: z.string(),
  snippet: z.string(),
  url: z.string(),
  date: z.string().nullable(),
});
export type SearchHitView = z.infer<typeof searchHitViewSchema>;

/** Watcher "araştırma" görünümü: kontrol çalışmaları + tespit olayları. */
export const checkRunViewSchema = z.object({
  id: z.string(),
  ranAt: z.string(),
  decision: z.boolean(),
  confidence: z.number().nullable(),
  summary: z.string().nullable(),
  reasoning: z.string().nullable(),
  searchQuery: z.string().nullable(),
  hits: z.array(searchHitViewSchema).nullable(),
});
export const detectionEventViewSchema = z.object({
  id: z.string(),
  description: z.string(),
  detectedAt: z.string(),
  facts: z.unknown().nullable(),
});
export const watchTimelineSchema = z.object({
  checkRuns: z.array(checkRunViewSchema),
  events: z.array(detectionEventViewSchema),
});
export type WatchTimeline = z.infer<typeof watchTimelineSchema>;
