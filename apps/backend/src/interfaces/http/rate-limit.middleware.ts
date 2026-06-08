import type { MiddlewareHandler } from "hono";
import type { RateLimiter } from "../../domain/rate-limit";
import type { AuthVariables } from "./auth.middleware";

type Vars = { Variables: AuthVariables };

/** Kullanıcı bazlı (auth'tan sonra) sınır; aşılırsa 429 + RateLimit/Retry-After başlıkları. */
export function rateLimit(limiter: RateLimiter, bucket: string): MiddlewareHandler<Vars> {
  return async (c, next) => {
    const id = c.get("userId") ?? "anon";
    const r = limiter.hit(`${bucket}:${id}`);
    c.header("X-RateLimit-Limit", String(r.limit));
    c.header("X-RateLimit-Remaining", String(r.remaining));
    c.header("X-RateLimit-Reset", String(r.resetSeconds));
    if (!r.allowed) {
      c.header("Retry-After", String(r.resetSeconds));
      return c.json({ error: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." }, 429);
    }
    await next();
  };
}

/** Sadece belirli HTTP metodunda iç middleware'i uygula (örn. yalnız POST). */
export function onlyMethod(method: string, mw: MiddlewareHandler<Vars>): MiddlewareHandler<Vars> {
  return async (c, next) => {
    if (c.req.method === method) return mw(c, next);
    return next();
  };
}
