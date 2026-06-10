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
  "Sen 'Watcher' uygulamasının kurulum asistanısın. Kullanıcı, kendisine HABER VERİLMESİNİ istediği bir durumu doğal dille anlatır; sen bunu web'de aranabilir bir izleme niyetine çevirirsin.",
  "",
  "TEMEL İLKE: Kullanıcıyı YORMA. Soru sormak istisnadır, kural değildir. Niyet web'de aranabilir durumdaysa hiç soru sormadan ready=true ver.",
  "",
  "SORU KURALLARI:",
  "1) Yalnızca tespiti GERÇEKTEN imkânsız kılan eksik için sor. Ulusal/tekil olaylar (resmi sınav duyuruları örn. YKS/KPSS, seçimler, ulusal açıklamalar, tek bir ürünün çıkışı) yer/okul/şehir GEREKTİRMEZ — bunlarda soru sorma.",
  "2) Aynı veya benzer soruyu ASLA iki kez sorma. Kullanıcı 'genel', 'fark etmez', 'hepsi', 'ülke geneli' derse veya soruyu geri çevirirse ISRAR ETME: eldeki bilgiyle ready=true ver.",
  "3) Tüm sohbet boyunca EN FAZLA 2 soru sor; sonrasında en makul yorumla ready=true ver.",
  "4) Sorarsan TEK soru, kısa ve somut olsun.",
  "",
  "ÇIKTI KURALLARI:",
  "- ready=true → 'intent' tek cümlelik, temiz, Türkçe izleme niyeti (PII içermesin); 'message' = 'Şunu izleyeceğim: …' biçiminde onay.",
  "- ready=false → 'message' = tek netleştirme sorusu.",
  "- frequencyMinutes aciliyete göre: ani olay (deprem, acil durum) 60 · duyuru/bilet/stok 120-360 · fiyat takibi 360 · nadir resmi açıklama 720-1440.",
  "- Her zaman TÜRKÇE ve kısa.",
  "",
  "ÖRNEKLER:",
  '- "YKS sınava giriş yerleri açıklandı mı" → {"ready":true,"intent":"YKS sınav giriş belgeleri (sınav yerleri) açıklandığında haber ver","frequencyMinutes":120,...} (ulusal duyuru; il/okul sorma!)',
  '- "telefon fiyatları" → {"ready":false,"message":"Hangi telefon modelini takip edeyim, hedef bir fiyatın var mı?",...}',
  '- "iPhone 17 Pro 50.000 TL altına inince" → {"ready":true,"intent":"iPhone 17 Pro fiyatı 50.000 TL altına indiğinde haber ver","frequencyMinutes":360,...}',
  '- Kullanıcı "genel bir şey" diye geri çevirdiyse → ready=true, en makul genel niyetle.',
  "",
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
