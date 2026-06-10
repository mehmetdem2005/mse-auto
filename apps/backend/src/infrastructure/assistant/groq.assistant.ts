import { z } from "zod";
import type {
  AssistantMessage,
  AssistantReply,
  IntentAssistant,
} from "../../domain/intent-assistant";
import { groqJsonChat } from "../groq/groq-json";

const ReplySchema = z.object({
  ready: z.boolean(),
  message: z.string().min(1),
  intent: z.string().nullable(),
  frequencyMinutes: z.number().int().positive().nullable(),
  confidence: z.number().min(0).max(1),
});

const SYSTEM = [
  "Sen 'Watcher' uygulamasının kurulum asistanısın. Kullanıcı, kendisine HABER VERİLMESİNİ istediği bir durumu doğal dille anlatır (örn. fiyat düşüşü, deprem, bilet çıkışı, açıklama).",
  "Görevin: izlenecek hedefi WEB'DE ARANABİLİR ve TESPİT EDİLEBİLİR olacak kadar SPESİFİK hale getirmek.",
  "Kurallar:",
  "1) İstek genel/muğlaksa (örn. 'telefon fiyatları', 'hava durumu') TEK BİR kısa, net soru sorarak daralt: hangi ürün/model? hangi eşik/fiyat? hangi şehir/bölge? hangi olay tam olarak? Aynı anda tek soru sor.",
  "2) Yeterince spesifik olduğunda (ne + hangi koşul + gerekiyorsa yer/eşik) ready=true ver; 'intent' alanına tek cümlelik, temiz, Türkçe izleme niyeti yaz (kişisel/gizli bilgi içermesin).",
  "3) frequencyMinutes'i aciliyete göre öner: acil/ani olaylar (deprem, acil duyuru) ~60; bilet/stok ~120; fiyat takibi ~360; nadir resmi açıklamalar ~720-1440.",
  "4) Her zaman TÜRKÇE ve kısa konuş. 'message' alanı kullanıcının göreceği metindir: ready=false ise nazik bir soru; ready=true ise 'Şunu izleyeyim: …' biçiminde net bir onay özeti.",
  'Çıktıyı YALNIZCA şu JSON şemasıyla ver: {"ready": boolean, "message": string, "intent": string|null, "frequencyMinutes": number|null, "confidence": number 0..1}.',
].join("\n");

/** Groq (OpenAI-uyumlu, JSON modu) niyet asistanı. */
export class GroqIntentAssistant implements IntentAssistant {
  constructor(
    private readonly apiKey: string,
    private readonly model = "llama-3.3-70b-versatile",
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async chat(history: AssistantMessage[]): Promise<AssistantReply> {
    const content = await groqJsonChat({
      apiKey: this.apiKey,
      model: this.model,
      messages: [{ role: "system", content: SYSTEM }, ...history],
      temperature: 0.3,
      maxTokens: 512,
      fetchImpl: this.fetchImpl,
    });
    return ReplySchema.parse(JSON.parse(content));
  }
}
