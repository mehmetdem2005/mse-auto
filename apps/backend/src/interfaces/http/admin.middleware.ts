import type { MiddlewareHandler } from "hono";
import type { AdminRepository } from "../../domain/billing";
import type { AuthVariables } from "./auth.middleware";

/** authMiddleware'den SONRA çalışır: kullanıcı admin değilse 403. */
export function adminMiddleware(
  admin: AdminRepository,
): MiddlewareHandler<{ Variables: AuthVariables }> {
  return async (c, next) => {
    const userId = c.get("userId");
    if (!userId || !(await admin.isAdmin(userId))) {
      return c.json({ error: "Yalnızca admin erişebilir" }, 403);
    }
    await next();
  };
}
