import type { MiddlewareHandler } from "hono";
import type { Logger } from "../../domain/logger";
import type { ModerationRepository } from "../../domain/moderation";
import type { AuthVariables } from "./auth.middleware";

/**
 * authMiddleware'den SONRA çalışır (ADR-104): banlı kullanıcı 403 alır.
 * Moderasyon sorgusu patlarsa FAIL-OPEN (logla + geçir) — nadir bir moderasyon
 * sorgusu yüzünden tüm API'yi düşürmek erişilebilirliği bozar (25010 Reliability).
 * Admin asla banlanmaz (setBanned reddeder) → admin bu kapıdan sorunsuz geçer.
 */
export function banGuard(
  moderation: ModerationRepository,
  logger: Logger,
): MiddlewareHandler<{ Variables: AuthVariables }> {
  return async (c, next) => {
    const userId = c.get("userId");
    if (userId) {
      try {
        if (await moderation.isBanned(userId)) {
          return c.json({ error: "Hesabınız askıya alındı" }, 403);
        }
      } catch (e) {
        logger.error("ban_check_failed", { err: e instanceof Error ? e.message : "bilinmeyen" });
      }
    }
    await next();
  };
}
