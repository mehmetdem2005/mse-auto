import { z } from "zod";
import type { EventReasoner, ReasonInput, ReasonResult } from "../../domain/reasoner";

const ReasonSchema = z.object({
  detected: z.boolean(),
  description: z.string().nullable(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
});

interface DeepSeekResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

/** DeepSeek (deepseek-v4-flash) — OpenAI-uyumlu, JSON modu. PII'siz girdi. */
export class DeepSeekEventReasoner implements EventReasoner {
  constructor(
    private readonly apiKey: string,
    private readonly model = "deepseek-v4-flash",
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

    const res = await this.fetchImpl("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        thinking: { type: "disabled" },
        temperature: 0,
        max_tokens: 1024,
      }),
    });
    if (!res.ok) throw new Error(`deepseek ${res.status}`);
    const data = (await res.json()) as DeepSeekResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("deepseek boş içerik");
    return ReasonSchema.parse(JSON.parse(content));
  }
}
