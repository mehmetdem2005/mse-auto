// Combined entry — HTTP sunucu + scheduler + worker'ları TEK process'te çalıştırır.
// Ücretsiz tek-servis (Render free) dağıtımı için: main.ts + worker.ts birleşimi.
// Worker+scheduler kurulumu startWorkers() ile worker.ts ile ortak (DRY).
import { serve } from "@hono/node-server";
import type { ServerType } from "@hono/node-server";
import { startWorkers } from "./application/start-workers";
import { createContainer } from "./config/container";
import { loadEnv } from "./config/env";
import { logger } from "./infrastructure/logging/logger";
import { createApp } from "./interfaces/http/app";
import { installProcessGuards, shutdownGracefully } from "./process-lifecycle";

const env = loadEnv();
const container = createContainer(env);
const app = createApp(container, env.CORS_ORIGINS);

installProcessGuards(logger);

const backend = env.SUPABASE_URL ? "supabase" : "in-memory";
const queueKind = env.DATABASE_URL ? "pg-boss" : "in-memory";

let workers: { stop: () => void } | null = null;
let server: ServerType | null = null;

async function main(): Promise<void> {
  await container.queue.init();
  workers = await startWorkers(container);

  server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
    logger.info("combined_ready", {
      port: info.port,
      env: env.NODE_ENV,
      repo: backend,
      queue: queueKind,
      roles: "http+monitoring+delivery+scheduler",
    });
  });

  // Telegram webhook kaydı (ADR-153): bot + genel URL varsa, gelen mesajları /telegram/webhook'a
  // yönlendir. Her dağıtımda idempotent çalışır; başarısızlık boot'u düşürmez (bot pasif kalır).
  const baseUrl = env.RENDER_EXTERNAL_URL ?? env.APP_URL;
  if (container.telegramBot && baseUrl) {
    const ok = await container.telegramBot.setWebhook(`${baseUrl}/telegram/webhook`);
    logger.info("telegram_webhook_set", { ok });
  }
}

main().catch((err: unknown) => {
  const e = err instanceof Error ? err : new Error(String(err));
  logger.error("combined_boot_failed", { message: e.message, stack: e.stack });
  process.exit(1);
});

shutdownGracefully(logger, async () => {
  workers?.stop();
  if (server) await new Promise<void>((resolve) => server?.close(() => resolve()));
  await container.queue.shutdown();
});
