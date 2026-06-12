import { z } from "zod";

/** Tüm hata yanıtlarının ortak zarfı; requestId destek/iz sürme içindir (x-request-id ile aynı). */
export const errorSchema = z.object({
  error: z.string(),
  requestId: z.string().optional(),
});
export type ApiError = z.infer<typeof errorSchema>;
