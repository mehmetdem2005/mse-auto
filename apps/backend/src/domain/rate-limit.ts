export interface RateResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

export interface RateLimiter {
  /** Anahtar için bir istek say; sınır aşıldıysa allowed=false. */
  hit(key: string, now?: number): RateResult;
}
