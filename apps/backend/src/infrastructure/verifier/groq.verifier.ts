import { z } from "zod";
import type { EventVerifier, VerifyInput, VerifyResult } from "../../domain/verifier";
import { groqJsonChat } from "../groq/groq-json";

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
 */
export class GroqEventVerifier implements EventVerifier {
  constructor(
    private readonly apiKey: string,
    private readonly model = "llama-3.3-70b-versatile",
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async verify(input: VerifyInput): Promise<VerifyResult> {
    const system = [
      "Bir DOĞRULAMA denetçisisin. Sana bir 'iddia' (bir olayın gerçekleştiği savı) ve onu destekleyen olduğu öne sürülen web arama sonuçları verilir.",
      "Görevin: kaynakların bu iddiayı GERÇEKTEN, AÇIKÇA ve GÜNCEL olarak kanıtlayıp kanıtlamadığını bağımsızca denetlemek. Başkasının gerekçesini değil, yalnız kanıtı değerlendir.",
      'Çıktı JSON: {"confirmed": boolean, "reason": string}.',
      "confirmed=true SADECE şu durumda: en az bir kaynak iddiayı doğrudan, açıkça ve güncel tarihle (eski/geçmiş yıl değil) destekliyorsa.",
      "ŞÜPHECİ OL: dolaylı ima, spekülasyon, 'olabilir/bekleniyor', konuyla yalnızca alakalı ama olayı doğrulamayan, ya da tarihi eski kaynaklar → confirmed=false.",
      "Yanlış onayın maliyeti yüksektir (kullanıcıya yanlış bildirim gider). Emin değilsen confirmed=false ver ve reason'da nedenini kısaca yaz.",
      "[CANLI]/[RESMÎ] etiketli kaynaklar kurumun kendi sitesindendir — en güçlü kanıt; varsa onlara ağırlık ver.",
    ].join(" ");
    const user = [
      `Bugünün tarihi: ${new Date().toISOString().slice(0, 10)}`,
      `İzlenen konu: ${input.canonicalQuery}`,
      `Doğrulanacak iddia: ${input.claim}`,
      "Kaynaklar:",
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
      maxTokens: 512,
      fetchImpl: this.fetchImpl,
    });
    return VerifySchema.parse(JSON.parse(content));
  }
}
