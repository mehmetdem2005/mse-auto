import type { ChannelMessage, ChannelSender } from "../../domain/channels";
import type { NotifyResult } from "../../domain/notifier";

/** Onaylı WhatsApp şablonu (Meta) — pencere dışı teslim için zorunlu. */
export interface WhatsAppTemplate {
  /** Meta'da onaylı şablon adı. */
  name: string;
  /** Şablon dil kodu, örn. "tr" veya "en_US". */
  lang: string;
}

/**
 * WhatsApp göndericisi — Meta WhatsApp Business Cloud API (ADR-084 + ADR-106).
 *
 * İKİ MOD:
 *  - **Şablon** (template verilirse): `type:"template"` — Meta'da ONAYLI, gövdesi 2 değişkenli
 *    ({{1}}=başlık, {{2}}=metin) şablonla gönderir. Proaktif uyarılar (24s penceresi dışı) için
 *    ZORUNLU yol; üretimde bu kullanılır.
 *  - **Serbest-metin** (template yoksa): `type:"text"` — yalnız kullanıcının son 24 saatte
 *    botla etkileşime girdiği "müşteri hizmeti penceresi" içinde iletilir; dışında Meta reddeder
 *    (success=false → iz kaydı). Dev/fallback.
 */
export class WhatsAppSender implements ChannelSender {
  readonly kind = "whatsapp" as const;
  constructor(
    private readonly accessToken: string,
    private readonly phoneNumberId: string,
    private readonly template: WhatsAppTemplate | null = null,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async send(to: string, msg: ChannelMessage): Promise<NotifyResult> {
    const payload = this.template
      ? {
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: this.template.name,
            language: { code: this.template.lang },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: msg.title },
                  { type: "text", text: msg.body },
                ],
              },
            ],
          },
        }
      : {
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: `${msg.title}\n${msg.body}` },
        };
    try {
      const res = await this.fetchImpl(
        `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) return { success: false, error: `whatsapp ${res.status}` };
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "whatsapp hata" };
    }
  }
}
