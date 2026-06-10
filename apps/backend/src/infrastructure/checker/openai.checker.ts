import { z } from "zod";
import type { CheckContext, CheckOutcome, Checker } from "../../domain/checker";
import type { CanonicalTopic } from "../../domain/topic";

const DecisionSchema = z.object({
  detected: z.boolean(),
  description: z.string().nullable(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
});

interface OpenAiResponse {
  output_text?: string;
  output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
}

/** Yanıt metninden ilk JSON bloğunu toleranslı çıkarır (markdown/çerçeve gürültüsüne dayanıklı). */
function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("JSON bulunamadı");
  return JSON.parse(text.slice(start, end + 1));
}

/**
 * Tek-anahtarlı checker: OpenAI Responses API + web_search aracı ile arama + karar
 * tek çağrıda. Yalnız PII'siz canonical sorgu gider (P1). Reasoner'a gerek yok.
 */
export class OpenAiChecker implements Checker {
  constructor(
    private readonly apiKey: string,
    private readonly model = "gpt-4o",
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async check(topic: CanonicalTopic, ctx?: CheckContext): Promise<CheckOutcome> {
    const input = [
      "Bir olay-tespit asistanısın. Web'de ara ve YALNIZ bulduğun güncel kaynaklara dayan; tahmin yürütme.",
      `İzlenen konu: "${topic.canonicalQuery}". Bu olay GERÇEKLEŞTİ mi?`,
      ...(ctx?.lastEventDescription
        ? [
            `Daha önce bildirilen olay: ${ctx.lastEventDescription} — yalnızca bundan FARKLI/YENİ bir gelişme tespittir; tekrarı için detected=false ver.`,
          ]
        : []),
      'SADECE şu JSON ile yanıtla: {"detected": boolean, "description": string|null, "reasoning": string, "confidence": number 0..1}.',
      "detected=true ise description olayın kısa, PII'siz açıklamasıdır; değilse null.",
    ].join("\n");

    const res = await this.fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        tools: [{ type: "web_search_preview" }],
        input,
      }),
    });
    if (!res.ok) throw new Error(`openai ${res.status}`);
    const data = (await res.json()) as OpenAiResponse;

    let text = data.output_text ?? "";
    if (!text) {
      for (const o of data.output ?? []) {
        if (o.type === "message") {
          for (const c of o.content ?? []) if (c.type === "output_text") text += c.text ?? "";
        }
      }
    }
    if (!text) throw new Error("openai boş içerik");

    const r = DecisionSchema.parse(extractJson(text));
    return {
      detected: r.detected,
      description: r.description,
      resultSummary: `OpenAI web araması (${this.model})`,
      reasoning: r.reasoning,
      confidence: r.confidence,
    };
  }
}
