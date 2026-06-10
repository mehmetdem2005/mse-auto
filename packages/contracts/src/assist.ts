import { z } from "zod";

/** Sohbet mesajı (niyet asistanı). PII içerebilir → yalnız LLM'e gider, kalıcı saklanmaz. */
export const assistMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});
export type AssistMessage = z.infer<typeof assistMessageSchema>;

export const assistChatInputSchema = z.object({
  messages: z.array(assistMessageSchema).min(1).max(40),
});
export type AssistChatInput = z.infer<typeof assistChatInputSchema>;

/**
 * Asistan yanıtı: ya bir netleştirme sorusu (ready=false) ya da izlemeye hazır,
 * spesifik bir niyet + önerilen sıklık (ready=true).
 */
export const assistReplySchema = z.object({
  ready: z.boolean(),
  message: z.string(), // kullanıcıya gösterilecek metin (soru ya da onay özeti)
  intent: z.string().nullable(), // ready ise temiz/spesifik niyet (tek cümle)
  frequencyMinutes: z.number().int().positive().nullable(),
  confidence: z.number().min(0).max(1),
});
export type AssistReply = z.infer<typeof assistReplySchema>;
