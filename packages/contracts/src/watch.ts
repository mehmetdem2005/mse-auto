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
export const createWatchInputSchema = z.object({
  rawIntent: z.string().min(3).max(500),
  frequencyMinutes: z.number().int().min(5).max(1440),
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
});
export type Watch = z.infer<typeof watchSchema>;
