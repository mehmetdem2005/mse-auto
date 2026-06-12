import type { Logger } from "./domain/logger";

/** Kapanışta bekleme üst sınırı — aşılırsa süreç zorla biter (asılı kalma yerine). */
const SHUTDOWN_TIMEOUT_MS = 8_000;

/**
 * Sessiz çökme yok: yakalanmayan hata/promiselar yapılandırılmış loglanır ve
 * süreç hatayla biter (platform — Render — yeniden başlatır). 12-factor disposability.
 */
export function installProcessGuards(logger: Logger): void {
  process.on("unhandledRejection", (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    logger.error("unhandled_rejection", { message: err.message, stack: err.stack });
    process.exit(1);
  });
  process.on("uncaughtException", (err) => {
    logger.error("uncaught_exception", { message: err.message, stack: err.stack });
    process.exit(1);
  });
}

/**
 * SIGTERM/SIGINT'te verilen temizliği çalıştırır; SHUTDOWN_TIMEOUT_MS içinde
 * bitmezse zorla çıkar (deploy'da süresiz asılı süreç bırakmamak için).
 */
export function shutdownGracefully(logger: Logger, cleanup: () => Promise<void>): void {
  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info("shutdown_started", { signal });
    const force = setTimeout(() => {
      logger.error("shutdown_timeout", { ms: SHUTDOWN_TIMEOUT_MS });
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    force.unref();
    cleanup()
      .then(() => {
        logger.info("shutdown_complete", {});
        process.exit(0);
      })
      .catch((err: unknown) => {
        logger.error("shutdown_failed", {
          message: err instanceof Error ? err.message : String(err),
        });
        process.exit(1);
      });
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
