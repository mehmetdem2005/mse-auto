import { z } from "zod";
import type { EventReasoner, ReasonInput, ReasonResult } from "../../domain/reasoner";
import { extractJson, openaiJsonChat } from "../llm/openai-json";
import { buildReasonPrompt } from "../llm/prompts";

const ReasonSchema = z.object({
  detected: z.boolean(),
  description: z.string().nullable(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
});

/**
 * DeepSeek olay muhakemesi — OpenAI-uyumlu. PII'siz girdi.
 * Varsayılan deepseek-v4-flash (JSON modu + düşünme kapalı: hız/maliyet);
 * "deepseek-reasoner" alias'ında JSON kipi kapatılır, tolerant ayrıştırılır.
 */
export class DeepSeekEventReasoner implements EventReasoner {
  constructor(
    private readonly apiKey: string,
    private readonly model = "deepseek-v4-flash",
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async reason(input: ReasonInput): Promise<ReasonResult> {
    const { system, user } = buildReasonPrompt(input);
    const reasoning = this.model === "deepseek-reasoner";
    const { content, tokensUsed } = await openaiJsonChat({
      baseUrl: "https://api.deepseek.com",
      apiKey: this.apiKey,
      model: this.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      jsonMode: !reasoning,
      ...(reasoning ? {} : { deepseekThinking: "disabled" as const }),
      temperature: 0,
      // Düşünme modunda akıl-yürütme token'ları da bütçeden düşer → geniş pay.
      maxTokens: reasoning ? 4096 : 1024,
      fetchImpl: this.fetchImpl,
    });
    return { ...ReasonSchema.parse(extractJson(content)), tokensUsed };
  }
}
