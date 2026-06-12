import { randomUUID } from "node:crypto";
import type { ApiError } from "@watcher/contracts";
import type { ErrorHandler, MiddlewareHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Logger } from "../../domain/logger";
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

/** Bilinen HTTP durumları için kullanıcı-dili mesajlar (iç mesaj sızdırılmaz). */
const HTTP_STATUS_MESSAGE: Record<number, string> = {
  400: "Geçersiz istek",
  401: "Kimlik doğrulanamadı",
  403: "Erişim reddedildi",
  408: "İstek zaman aşımına uğradı",
  413: "İstek gövdesi çok büyük",
  429: "Çok fazla istek",
  504: "İstek zaman aşımına uğradı",
};

/**
 * Yakalanmayan hatalar → logla + iç detay sızdırmadan sözleşme zarfı (ApiError).
 * Bilinçli HTTP hataları (bodyLimit 413, timeout 504…) kendi durum kodunu korur;
 * zarfta destek/iz sürme için requestId döner (x-request-id başlığıyla aynı).
 */
export function errorHandler(logger: Logger): ErrorHandler<Vars> {
  return (err, c) => {
    const reqId = c.get("requestId");
    if (err instanceof HTTPException) {
      logger.warn("http_exception", {
        requestId: reqId,
        path: c.req.path,
        status: err.status,
        message: err.message,
      });
      const body: ApiError = {
        error: HTTP_STATUS_MESSAGE[err.status] ?? "İstek işlenemedi",
        requestId: reqId,
      };
      return c.json(body, err.status);
    }
    // Error olmayan fırlatmalar (string vb.) iz kaybetmesin diye normalize edilir.
    const e = err instanceof Error ? err : new Error(String(err));
    logger.error("unhandled", {
      requestId: reqId,
      path: c.req.path,
      message: e.message,
      stack: e.stack,
    });
    const body: ApiError = { error: "Sunucu hatası", requestId: reqId };
    return c.json(body, 500);
  };
}

/** Tanımsız yol → Hono'nun boş 404'ü yerine sözleşme zarfı (ApiError). */
export function notFoundHandler(): NotFoundHandler<Vars> {
  return (c) => {
    const body: ApiError = { error: "Yol bulunamadı", requestId: c.get("requestId") };
    return c.json(body, 404);
  };
}
