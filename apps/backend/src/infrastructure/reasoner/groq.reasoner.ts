import { z } from "zod";
import type { EventReasoner, ReasonInput, ReasonResult } from "../../domain/reasoner";
import { groqJsonChat } from "../groq/groq-json";

const ReasonSchema = z.object({
  detected: z.boolean(),
  description: z.string().nullable(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
});

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
      "ÖNEMLİ: 'Daha önce bildirilen olay' verilirse, yalnızca ondan FARKLI/YENİ bir gelişme tespittir; aynı olayın tekrarı/teyidi için detected=false ver ve reasoning'de 'daha önce bildirildi' de.",
      "TARİH: Sana bugünün tarihi verilir. Sonuçların tarihlerini bugünle kıyasla — bugüne yakın tarihli kanıt olmadan detected=true verme; eski tarihli (geçen yıl/aylar önce) haber güncel olayın kanıtı DEĞİLDİR.",
    ].join(" ");
    const user = [
      `Bugünün tarihi: ${new Date().toISOString().slice(0, 10)}`,
      `İzlenen konu: ${input.canonicalQuery}`,
      ...(input.lastEventDescription
        ? [`Daha önce bildirilen olay: ${input.lastEventDescription}`]
        : []),
      "Arama sonuçları:",
      ...input.hits.map((h, i) => `${i + 1}. ${h.title} — ${h.snippet} (${h.date ?? "tarih yok"})`),
    ].join("\n");

    const content = await groqJsonChat({
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
    return ReasonSchema.parse(JSON.parse(content));
  }
}
