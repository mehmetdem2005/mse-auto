import type { ChannelMessage, ChannelSender } from "../../domain/channels";
import type { NotifyResult } from "../../domain/notifier";

/**
 * WhatsApp göndericisi — Meta WhatsApp Business Cloud API (ADR-084).
 *
 * DÜRÜST SINIR: serbest-metin mesajı yalnız kullanıcının son 24 saatte botla
 * etkileşime girdiği "müşteri hizmeti penceresi" içinde iletilir. Pencere
 * dışında Meta yalnız ÖNCEDEN ONAYLI ŞABLON mesajına izin verir. Bu adaptör
 * text gönderir; pencere dışıysa Meta hata döndürür (success=false → iz kaydı).
 * Tam üretim için onaylı şablon + iş hesabı doğrulaması gerekir (env'le hazır).
 */
export class WhatsAppSender implements ChannelSender {
  readonly kind = "whatsapp" as const;
  constructor(
    private readonly accessToken: string,
    private readonly phoneNumberId: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async send(to: string, msg: ChannelMessage): Promise<NotifyResult> {
    try {
      const res = await this.fetchImpl(
        `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: `${msg.title}\n${msg.body}` },
          }),
        },
      );
      if (!res.ok) return { success: false, error: `whatsapp ${res.status}` };
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "whatsapp hata" };
    }
  }
}
