import type { ChannelMessage, ChannelSender } from "../../domain/channels";
import type { NotifyResult } from "../../domain/notifier";

/**
 * Telegram Bot API göndericisi (ADR-084). Kullanıcı bota /start der, biz onun
 * chat_id'sine sendMessage atarız. Ücretsiz; tek gereken bot token'ı (env).
 */
export class TelegramSender implements ChannelSender {
  readonly kind = "telegram" as const;
  constructor(
    private readonly botToken: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async send(chatId: string, msg: ChannelMessage): Promise<NotifyResult> {
    try {
      const res = await this.fetchImpl(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `*${msg.title}*\n${msg.body}`,
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        }),
      });
      if (!res.ok) return { success: false, error: `telegram ${res.status}` };
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "telegram hata" };
    }
  }
}
