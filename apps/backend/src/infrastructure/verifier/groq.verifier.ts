import { z } from "zod";
import type { EventVerifier, VerifyInput, VerifyResult } from "../../domain/verifier";
import { groqJsonChatWithUsage } from "../groq/groq-json";
import { buildVerifyPrompt } from "../llm/prompts";

const VerifySchema = z.object({
  confirmed: z.boolean(),
  reason: z.string(),
});

/**
 * Groq tabanlı bağımsız doğrulayıcı (ADR-060 A1). Reasoner'dan AYRI, daha
 * ŞÜPHECİ bir prompt'la çalışır: "kaynaklar bu iddiayı gerçekten kanıtlıyor mu?"
 * Reasoner'ın gerekçesini görmez → taze, önyargısız ikinci bakış (generator-verifier).
 * Varsayılan: reddetmeye meyilli (kanıt zayıfsa confirmed=false) — yanlış-pozitif maliyeti
 * (kullanıcıya yanlış bildirim) yüksek olduğundan tutucu davranır.
 * İstem tek kaynaktan (llm/prompts — ADR-095).
 */
export class GroqEventVerifier implements EventVerifier {
  constructor(
    private readonly apiKey: string,
    private readonly model = "llama-3.3-70b-versatile",
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async verify(input: VerifyInput): Promise<VerifyResult> {
    const { system, user } = buildVerifyPrompt(input);
    const { content, tokensUsed } = await groqJsonChatWithUsage({
      apiKey: this.apiKey,
      model: this.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0,
      maxTokens: 512,
      fetchImpl: this.fetchImpl,
    });
    return { ...VerifySchema.parse(JSON.parse(content)), tokensUsed };
  }
}
