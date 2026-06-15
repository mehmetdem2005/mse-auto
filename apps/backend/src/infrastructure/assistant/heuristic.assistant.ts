import type {
  AssistantMessage,
  AssistantReply,
  IntentAssistant,
} from "../../domain/intent-assistant";

/**
 * Anahtarsız/dev ortam için sezgisel niyet asistanı (LLM yok).
 * İlk istek çok kısa/genelse bir kez netleştirme sorusu sorar; aksi halde
 * (veya kullanıcı yanıt verdikten sonra) niyeti hazır kabul eder.
 * Üretimde fizibilite ajanı / tek-atış asistan (ADR-129/126) devrededir; bu, LLM geçici
 * hatasında dayanıklılık fallback'i (ADR-118) + anahtarsız yerel çalışma içindir.
 */
/** Tüm kullanıcı metni bundan kısaysa muğlak sayılır (LLM istemindeki "genel istek" eşiğine paralel). */
const VAGUE_COMBINED_CHARS = 20;
/** Tek mesajlık sohbette ilk mesaj bundan kısaysa muğlak sayılır. */
const VAGUE_FIRST_MSG_CHARS = 35;

/**
 * "İzlenebilir gerçek istek değil" sezgisi (LLM yokken SON savunma — ADR-119).
 * Aşırı tekrarlı ("ne ne ne adın ne") ya da hiç içerik-kelimesi olmayan metni REDDEDER →
 * sezgisel mod saçma girdiden junk watch ÜRETMEZ.
 */
function looksUnmonitorable(text: string): boolean {
  const words = text.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  // Aşırı tekrar: benzersiz kelime oranı çok düşük.
  if (words.length >= 3 && new Set(words).size / words.length < 0.5) return true;
  // Hiç anlamlı içerik kelimesi (≥4 harf) yoksa muhtemelen istek değildir.
  return !words.some((w) => w.replace(/[^\p{L}\p{N}]/gu, "").length >= 4);
}

/**
 * Soru / asistan-hakkında / izleme-isteği-DEĞİL sezgisi (ADR-126). LLM yokken sezgisel mod
 * "hangi modeldesin", "naber", "kimsin" gibi konuşmaları niyet sanıp watch ÜRETMESİN.
 */
function looksLikeQuestion(text: string): boolean {
  const t = text.toLowerCase();
  // Asistanın kendisi/teknolojisi hakkında — izleme isteği değil.
  if (/\b(deepseek|gpt|chatgpt|claude|yapay\s*zek|asistan|model[ıi]nde)\b/.test(t)) return true;
  // Kısa + soru/selam belirteçli (izlenecek somut bir şey yok).
  return (
    t.length < 40 &&
    (t.includes("?") || /\b(hangi|nas[ıi]l|nedir|kimsin|naber|selam|which|what|how)\b/.test(t))
  );
}

/**
 * "Ne yapabilirsin / örnek ver / neleri izleyebilirsin / N madde" gibi KAPASİTE-örnek isteği (ADR-130).
 * LLM yokken bu girdi ya "muğlak" clarify'ına ya da (uzunsa) ready=true junk niyete düşüyordu;
 * bunun yerine yardımcı bir örnek-listesiyle yanıtla → asistan soruyu GERÇEKTEN cevaplar, junk üretmez.
 */
function looksLikeCapabilityRequest(text: string): boolean {
  const t = text.toLowerCase();
  // TR: yetenek/örnek/liste isteği (ekler nedeniyle gevşek kök eşleşmesi).
  if (
    /(ne(ler)? yapab|i[şs]e yarar|kullanab[iı]lece|[öo]rnek|neleri (izle|takip)|ne t[üu]r [şs]ey|kapasite|yetene[ğg])/.test(
      t,
    )
  ) {
    return true;
  }
  // EN
  return /(what can you do|what do you do|use (you )?for|use ?cases?|examples?|capabilit|give me .*(list|example))/.test(
    t,
  );
}

/** Kapasite isteğine yardımcı, çeşitli örnekli yanıt (numaralı liste — kullanıcı "liste/madde" istedi). */
function capabilityAnswer(tr: boolean): string {
  return tr
    ? "Şunlar gibi pek çok şeyi takip edebilirim:\n1. Bir ürünün fiyatı belirlediğin eşiğin altına inince\n2. Bir sınav sonucu ya da giriş belgesi açıklanınca\n3. Bir randevu/başvuru sistemi açılınca (kamusal duyuru üzerinden)\n4. Bir etkinliğe biletler satışa çıkınca\n5. Tükenen bir ürün yeniden stoğa girince\n6. Yeni bir iş ya da burs ilanı yayınlanınca\n7. Resmî bir kurum yeni bir duyuru veya karar yayınlayınca\n8. Döviz ya da bir hisse belirli bir seviyeyi geçince\nHangisi sana uygun? İstersen kendi cümlenle de anlatabilirsin."
    : "I can watch things like:\n1. A product's price dropping below a threshold you set\n2. An exam result or entry document being announced\n3. An appointment or application system opening (via the public announcement)\n4. Tickets for an event going on sale\n5. A sold-out product coming back in stock\n6. A new job or scholarship posting\n7. An official body publishing a new announcement or decision\n8. A currency or stock crossing a level\nWhich one fits you? You can also describe your own in a sentence.";
}

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

    // ADR-130: "ne yapabilirsin / örnek ver / N madde" → yardımcı örnek-listesiyle yanıtla
    // (muğlak clarify ya da ready=true junk niyetten ÖNCE). LLM düşse de soru gerçekten cevaplanır.
    if (looksLikeCapabilityRequest(lastUser)) {
      return {
        ready: false,
        message: capabilityAnswer(tr),
        intent: null,
        frequencyMinutes: null,
        confidence: 0.3,
      };
    }

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

    // ADR-126: yalnız SON kullanıcı mesajını niyet adayı al — çok-turlu sohbeti BİRLEŞTİRİP
    // junk niyet üretme (eskiden `combined` ile tüm sohbet tek niyet sanılıyordu).
    const intent = lastUser;
    // ADR-119/126: saçma/tekrarlı, çok kısa VEYA soru/asistan-hakkında girdiyi onaya çıkarma.
    if (intent.length < 12 || looksUnmonitorable(intent) || looksLikeQuestion(intent)) {
      return {
        ready: false,
        message: tr
          ? "Bunu tam anlayamadım. Neyi, hangi koşulda takip etmemi istediğini gerçek bir cümleyle anlatır mısın? Örneğin: bir ürünün fiyatı belirli bir eşiğin altına inince haber ver."
          : "I couldn't quite make sense of that. Could you describe, in a real sentence, what to watch and under what condition? For example: notify me when a product's price drops below a threshold.",
        intent: null,
        frequencyMinutes: null,
        confidence: 0.2,
      };
    }
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
