/**
 * Niyet asistanı port'u — kullanıcının doğal-dil isteğini sohbetle netleştirir.
 * Genel/muğlak istekte tek tek spesifik soru sorar; yeterince netleşince
 * izlemeye hazır (ready) temiz bir niyet + önerilen kontrol sıklığı döndürür.
 */

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantReply {
  /** true → spesifik, izlenebilir niyet hazır; false → daha fazla bilgi gerek. */
  ready: boolean;
  /** Kullanıcıya gösterilecek metin: netleştirme sorusu veya onay özeti. */
  message: string;
  /** ready ise temiz/spesifik niyet (tek cümle, izleme için kanonikleştirilebilir). */
  intent: string | null;
  /** Önerilen kontrol sıklığı (dakika); aciliyetine göre. */
  frequencyMinutes: number | null;
  confidence: number; // 0..1
  /** ADR-110: arama planı — hangi sorgu, hangi yöntemler, fizibilite (ready ise). */
  searchQuery?: string | null | undefined;
  searchMethods?: string[] | undefined;
  feasibility?: string | null | undefined;
  /** ADR-129: olaya özel yapısal fizibilite (ajan araştırması sonrası). */
  feasibilityVerdict?: "can" | "partial" | "cannot" | null | undefined;
  plannedSteps?: string[] | undefined;
  sitePermission?: { allowed: boolean; note: string } | null | undefined;
}

export interface IntentAssistant {
  /**
   * @param lang Kullanıcının arayüz dili (ör. "tr", "en") — yanıt bu dilde yazılır.
   * @param userContext ADR-113: kullanıcının kendini tanıtması + ek dikkat (varsa) — sistem istemine eklenir.
   */
  chat(history: AssistantMessage[], lang?: string, userContext?: string): Promise<AssistantReply>;
}
