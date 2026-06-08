import { z } from "zod";

/**
 * PII'siz paylaşılan izleme birimi (dedup'ın kalbi, P2).
 * Dış hatta yalnızca `canonicalQuery` + herkese açık sonuç gider (P1).
 */
export const canonicalTopicSchema = z.object({
  id: z.string().min(1),
  canonicalQuery: z.string().min(1),
  lastCheckedAt: z.iso.datetime().nullable(),
});
export type CanonicalTopic = z.infer<typeof canonicalTopicSchema>;
