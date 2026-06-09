import { z } from "zod";

/** Birleşik aktivite akışı: kullanıcının watcher'larına düşen tespitler (teslimat + olay). */
export const feedItemSchema = z.object({
  deliveryId: z.string(),
  watchId: z.string(),
  watchIntent: z.string(),
  eventId: z.string(),
  description: z.string(),
  detectedAt: z.string(),
  facts: z.unknown().nullable(),
  channel: z.string(),
  status: z.string(),
});
export type FeedItem = z.infer<typeof feedItemSchema>;
export const feedListSchema = z.array(feedItemSchema);

/** Tespit geri bildirimi (user_feedback): doğru/yanlış. */
export const feedbackInputSchema = z.object({ verdict: z.enum(["correct", "incorrect"]) });
export type FeedbackInput = z.infer<typeof feedbackInputSchema>;
