import { z } from "zod";
import type { EventReasoner, ReasonInput, ReasonResult } from "../../domain/reasoner";
import { groqJsonChatWithUsage } from "../groq/groq-json";
import { buildReasonPrompt } from "../llm/prompts";

const ReasonSchema = z.object({
  detected: z.boolean(),
  description: z.string().nullable(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
});

/**
 * Groq (OpenAI-uyumlu, JSON modu) olay muhakemesi. PII'siz girdi.
 * İstem tek kaynaktan (llm/prompts — ADR-095): model değişse de sözleşme aynı.
 */
export class GroqEventReasoner implements EventReasoner {
  constructor(
    private readonly apiKey: string,
    private readonly model = "llama-3.3-70b-versatile",
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async reason(input: ReasonInput): Promise<ReasonResult> {
    const { system, user } = buildReasonPrompt(input);
    const { content, tokensUsed } = await groqJsonChatWithUsage({
      apiKey: this.apiKey,
      model: this.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0,
      maxTokens: 1024,
      fetchImpl: this.fetchImpl,
    });
    return { ...ReasonSchema.parse(JSON.parse(content)), tokensUsed };
  }
}
