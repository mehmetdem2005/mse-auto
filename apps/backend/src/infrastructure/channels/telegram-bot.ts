import { createHash } from "node:crypto";
import type { TelegramReplier } from "../../application/telegram";

export interface TelegramBotInfo {
  id: number;
  username: string;
}

/**
 * Telegram Bot API kontrol yüzeyi (ADR-153) — GELEN güncellemeler + bot kimliği + webhook kurulumu.
 * TelegramSender YALNIZ uyarı gönderir (ChannelSender); bu sınıf bot'u "konuşur" + "otomatik bağlanır"
 * yapan webhook akışını besler (getMe/sendText/setWebhook). İkisi de aynı token'ı kullanır ama
 * sorumlulukları ayrıdır (uyarı kanalı vs. bot kontrolü).
 */
export class TelegramBotApi implements TelegramReplier {
  private me: TelegramBotInfo | null = null;
  constructor(
    private readonly botToken: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  /**
   * Webhook doğrulama gizi — bot token'ından TÜRETİLİR (yeni env gerekmez; tersinemez sha256).
   * Telegram her webhook çağrısında `X-Telegram-Bot-Api-Secret-Token` başlığında bunu yollar →
   * route bunu doğrular (yetkisiz POST reddedilir).
   */
  webhookSecret(): string {
    return createHash("sha256").update(`whenly:${this.botToken}`).digest("hex").slice(0, 48);
  }

  async getMe(): Promise<TelegramBotInfo | null> {
    if (this.me) return this.me;
    try {
      const res = await this.fetchImpl(`https://api.telegram.org/bot${this.botToken}/getMe`);
      if (!res.ok) return null;
      const j = (await res.json()) as { ok?: boolean; result?: { id: number; username: string } };
      if (!j.ok || !j.result) return null;
      this.me = { id: j.result.id, username: j.result.username };
      return this.me;
    } catch {
      return null;
    }
  }

  /** Düz-metin yanıt (bot konuşması) — uyarı biçimlemesi YOK; webhook yanıtları için. */
  async sendText(chatId: string, text: string): Promise<boolean> {
    try {
      const res = await this.fetchImpl(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /** Telegram'a "gelen mesajları şu URL'e gönder" der (yalnız message; secret_token doğrulamalı). */
  async setWebhook(url: string): Promise<boolean> {
    try {
      const res = await this.fetchImpl(`https://api.telegram.org/bot${this.botToken}/setWebhook`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url,
          secret_token: this.webhookSecret(),
          allowed_updates: ["message"],
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
