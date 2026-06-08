import type { RateLimiter, RateResult } from "../../domain/rate-limit";

interface Window {
  count: number;
  resetAt: number;
}

/**
 * Sabit-pencere sayaç (dev/tek-instance). Çok-instance üretimde paylaşılan store
 * (Redis/Postgres) gerekir — RateLimiter portu arkasında değiştirilebilir (ADR-013).
 */
export class InMemoryRateLimiter implements RateLimiter {
  private readonly windows = new Map<string, Window>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  hit(key: string, now: number = Date.now()): RateResult {
    const existing = this.windows.get(key);
    if (!existing || existing.resetAt <= now) {
      this.windows.set(key, { count: 1, resetAt: now + this.windowMs });
      return {
        allowed: true,
        limit: this.limit,
        remaining: this.limit - 1,
        resetSeconds: Math.ceil(this.windowMs / 1000),
      };
    }
    existing.count += 1;
    return {
      allowed: existing.count <= this.limit,
      limit: this.limit,
      remaining: Math.max(0, this.limit - existing.count),
      resetSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
}
