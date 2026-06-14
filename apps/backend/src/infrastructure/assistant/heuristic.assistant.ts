import type {
  AssistantMessage,
  AssistantReply,
  IntentAssistant,
} from "../../domain/intent-assistant";

/**
 * Anahtarsız/dev ortam için sezgisel niyet asistanı (LLM yok).
 * İlk istek çok kısa/genelse bir kez netleştirme sorusu sorar; aksi halde
 * (veya kullanıcı yanıt verdikten sonra) niyeti hazır kabul eder.
 * Üretimde GroqIntentAssistant devrededir; bu yalnız tip uyumu + yerel çalışma.
 */
/** Tüm kullanıcı metni bundan kısaysa muğlak sayılır (LLM istemindeki "genel istek" eşiğine paralel). */
const VAGUE_COMBINED_CHARS = 20;
/** Tek mesajlık sohbette ilk mesaj bundan kısaysa muğlak sayılır. */
const VAGUE_FIRST_MSG_CHARS = 35;

export class HeuristicIntentAssistant implements IntentAssistant {
  // ADR-113: userContext sezgisel modda kullanılmaz (LLM yok); imza uyumu için kabul edilir.
  async chat(
    history: AssistantMessage[],
    lang?: string,
    _userContext?: string,
  ): Promise<AssistantReply> {
    const tr = (lang ?? "tr").startsWith("tr");
    const userMsgs = history.filter((m) => m.role === "user");
    // Selamlama balonu geçmişin başında gelebilir; "soru soruldu mu" kararı
    // İLK KULLANICI mesajından SONRAKİ asistan mesajına bakar.
    const firstUserIdx = history.findIndex((m) => m.role === "user");
    const assistantAsked =
      firstUserIdx >= 0 && history.slice(firstUserIdx + 1).some((m) => m.role === "assistant");
    const lastUser = userMsgs.at(-1)?.content.trim() ?? "";
    const combined = userMsgs
      .map((m) => m.content.trim())
      .join(" ")
      .trim();

    const vague =
      combined.length < VAGUE_COMBINED_CHARS ||
      (userMsgs.length <= 1 && lastUser.length < VAGUE_FIRST_MSG_CHARS);

    if (vague && !assistantAsked) {
      return {
        ready: false,
        message: tr
          ? "Biraz daha spesifik olalım: tam olarak neyi, hangi koşulda takip edeyim? Örneğin ürün/model, bir fiyat eşiği ya da şehir belirt."
          : "Let's get a bit more specific: what exactly should I watch, and under what condition? For example a product/model, a price threshold, or a city.",
        intent: null,
        frequencyMinutes: null,
        confidence: 0.3,
      };
    }

    const intent = lastUser.length >= combined.length ? lastUser : combined;
    return {
      ready: true,
      message: tr
        ? `Şunu izleyeyim: "${intent}". Onaylıyorsan oluşturayım.`
        : `I'll watch this: "${intent}". Confirm and I'll create it.`,
      intent,
      frequencyMinutes: 360,
      confidence: 0.6,
    };
  }
}
