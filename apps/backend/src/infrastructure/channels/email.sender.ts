import type { ChannelMessage, ChannelSender } from "../../domain/channels";
import type { NotifyResult } from "../../domain/notifier";

/**
 * E-posta göndericisi — Resend HTTP API (ADR-084). Tek gereken API anahtarı +
 * doğrulanmış gönderen adres (env). SMTP yerine HTTP: Render free'de ek bağımlılık yok.
 */
export class ResendEmailSender implements ChannelSender {
  readonly kind = "email" as const;
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async send(to: string, msg: ChannelMessage): Promise<NotifyResult> {
    try {
      const res = await this.fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: this.from,
          to: [to],
          subject: msg.title,
          text: `${msg.body}\n\n— Whenly`,
        }),
      });
      if (!res.ok) return { success: false, error: `email ${res.status}` };
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "email hata" };
    }
  }
}
