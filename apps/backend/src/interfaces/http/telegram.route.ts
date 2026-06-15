import { OpenAPIHono } from "@hono/zod-openapi";
import { type TelegramUpdate, handleTelegramUpdate } from "../../application/telegram";
import type { Container } from "../../config/container";

/**
 * Telegram webhook (ADR-153) — AUTH ÖNCESİ açık uç (Telegram çağırır, kullanıcı token'ı yok).
 * `/v1/*` dışındadır → auth/rate-limit uygulanmaz. Güvenlik: Telegram'ın yolladığı
 * `X-Telegram-Bot-Api-Secret-Token` başlığı, token'dan türetilmiş gizle doğrulanır.
 * Her durumda 200 döner (Telegram aksi halde retry eder); hata yutulur (loglanır).
 */
export function telegramRoutes(container: Container): OpenAPIHono {
  const app = new OpenAPIHono();
  app.post("/webhook", async (c) => {
    const bot = container.telegramBot;
    if (!bot) return c.json({ ok: true }, 200); // token yok → bot pasif, sessiz kabul
    const secret = c.req.header("x-telegram-bot-api-secret-token");
    if (secret !== bot.webhookSecret()) return c.json({ ok: false }, 401);
    let update: TelegramUpdate;
    try {
      update = (await c.req.json()) as TelegramUpdate;
    } catch {
      return c.json({ ok: true }, 200);
    }
    try {
      await handleTelegramUpdate(
        { replier: bot, links: container.telegramLinks, userChannels: container.userChannels },
        update,
      );
    } catch (e) {
      container.logger.error("telegram_webhook_failed", {
        message: e instanceof Error ? e.message : String(e),
      });
    }
    return c.json({ ok: true }, 200);
  });
  return app;
}
