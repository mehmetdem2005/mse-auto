import { randomUUID } from "node:crypto";
import type { ErrorHandler, MiddlewareHandler } from "hono";
import type { Logger } from "../../infrastructure/logging/logger";
import type { AuthVariables } from "./auth.middleware";

type Vars = { Variables: AuthVariables };

/** Gelen x-request-id'yi taşır ya da üretir; yanıta yansıtır; loglarda kullanılır. */
export function requestId(): MiddlewareHandler<Vars> {
  return async (c, next) => {
    const id = c.req.header("x-request-id") ?? randomUUID();
    c.set("requestId", id);
    c.header("x-request-id", id);
    await next();
  };
}

/** Her isteği yapılandırılmış logla (metot, yol, durum, süre, kullanıcı, requestId). */
export function requestLogger(logger: Logger): MiddlewareHandler<Vars> {
  return async (c, next) => {
    const start = Date.now();
    await next();
    logger.info("request", {
      requestId: c.get("requestId"),
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      ms: Date.now() - start,
      userId: c.get("userId") ?? null,
    });
  };
}

/** Yakalanmayan hatalar → logla + iç detay sızdırmadan 500. */
export function errorHandler(logger: Logger): ErrorHandler<Vars> {
  return (err, c) => {
    logger.error("unhandled", {
      requestId: c.get("requestId"),
      message: err.message,
      stack: err.stack,
    });
    return c.json({ error: "Sunucu hatası" }, 500);
  };
}
