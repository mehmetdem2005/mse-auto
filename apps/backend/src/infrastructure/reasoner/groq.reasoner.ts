import { z } from "zod";
import type { EventReasoner, ReasonInput, ReasonResult } from "../../domain/reasoner";

const ReasonSchema = z.object({
  detected: z.boolean(),
  description: z.string().nullable(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
});

interface GroqResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

/**
 * Groq (OpenAI-uyumlu, JSON modu) olay muhakemesi. PII'siz girdi.
 * Geçici reasoner (ücretsiz/hızlı); DeepSeek fonlanınca kalıcıya geçilir.
 */
export class GroqEventReasoner implements EventReasoner {
  constructor(
    private readonly apiKey: string,
    private readonly model = "llama-3.3-70b-versatile",
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async reason(input: ReasonInput): Promise<ReasonResult> {
    const system = [
      "Bir olay-tespit asistanısın. Kullanıcının izlediği konuyla ilgili web arama sonuçları verilir.",
      "Olayın GERÇEKLEŞİP gerçekleşmediğine yalnızca sonuçlara dayanarak karar ver; tahmin yürütme.",
      'Çıktıyı şu JSON şemasıyla ver: {"detected": boolean, "description": string|null, "reasoning": string, "confidence": number 0..1}.',
      "detected=true ise description olayın kısa, PII'siz açıklamasıdır; aksi halde null.",
    ].join(" ");
    const user = [
      `İzlenen konu: ${input.canonicalQuery}`,
      "Arama sonuçları:",
      ...input.hits.map((h, i) => `${i + 1}. ${h.title} — ${h.snippet} (${h.date ?? "tarih yok"})`),
    ].join("\n");

    const res = await this.fetchImpl("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 1024,
      }),
    });
    if (!res.ok) throw new Error(`groq ${res.status}`);
    const data = (await res.json()) as GroqResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("groq boş içerik");
    return ReasonSchema.parse(JSON.parse(content));
  }
}
