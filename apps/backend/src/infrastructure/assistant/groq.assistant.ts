import { z } from "zod";
import type {
  AssistantMessage,
  AssistantReply,
  IntentAssistant,
} from "../../domain/intent-assistant";
import { groqJsonChat } from "../groq/groq-json";
import { ASSISTANT_SYSTEM, assistantLangRule } from "../llm/prompts";

const ReplySchema = z.object({
  ready: z.boolean(),
  message: z.string().min(1),
  intent: z.string().nullable(),
  frequencyMinutes: z.number().int().positive().nullable(),
  confidence: z.number().min(0).max(1),
});

/**
 * Groq (OpenAI-uyumlu, JSON modu) niyet asistanı.
 * İstem tek kaynaktan (llm/prompts — ADR-095): ADR-074 uydurma-yasağı +
 * ADR-093 dile-uyum kuralı orada tanımlıdır.
 */
export class GroqIntentAssistant implements IntentAssistant {
  constructor(
    private readonly apiKey: string,
    private readonly model = "llama-3.3-70b-versatile",
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async chat(history: AssistantMessage[], lang?: string): Promise<AssistantReply> {
    const content = await groqJsonChat({
      apiKey: this.apiKey,
      model: this.model,
      messages: [
        { role: "system", content: ASSISTANT_SYSTEM + assistantLangRule(lang) },
        ...history,
      ],
      // Düşük sıcaklık (ADR-074): kurallara sadık, "yaratıcı" detay uydurmasını azaltır.
      temperature: 0.1,
      maxTokens: 512,
      fetchImpl: this.fetchImpl,
    });
    return ReplySchema.parse(JSON.parse(content));
  }
}
