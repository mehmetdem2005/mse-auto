/**
 * Reliability layer. The difference between a toy and a system: things fail, and the system
 * recovers predictably instead of getting stuck or stampeding.
 *
 *  - Error taxonomy: RetryableError vs FatalError (so we don't retry a bad input forever).
 *  - withTimeout: a hung Gemini/ffmpeg/YouTube call can't freeze the loop.
 *  - withRetry: exponential backoff + jitter, bounded attempts.
 *  - CircuitBreaker: after repeated failures to a dependency, stop hammering it for a cooldown.
 *  - claimNextJob / reclaimStaleLocks: atomic leasing so two workers never grab the same job.
 */
import { supabase } from "./supabase.js";
import { env } from "./env.js";
import { log } from "./logger.js";

export class RetryableError extends Error {}
export class FatalError extends Error {}

/** Detect Gemini/YouTube rate-limit responses (429 / RESOURCE_EXHAUSTED). */
export function isRateLimit(e: any): boolean {
  const status = e?.status ?? e?.code ?? e?.response?.status;
  const msg = String(e?.message || e || "");
  return status === 429 || /RESOURCE_EXHAUSTED|rate limit|quota/i.test(msg);
}
/** Best-effort Retry-After (ms) from an error/response. */
function retryAfterMs(e: any): number | null {
  const h = e?.response?.headers;
  const ra = h?.get?.("retry-after") ?? h?.["retry-after"];
  if (!ra) return null;
  const secs = Number(ra);
  return Number.isFinite(secs) ? secs * 1000 : null;
}

/**
 * How long to wait before resuming the SAME request after a rate-limit, instead of failing it.
 * Honors Retry-After, then an error-attached resumeAt (e.g. RPD reset), then a configurable default.
 */
export function rateLimitWaitMs(e: any): number {
  const ra = retryAfterMs(e);
  if (ra && ra > 0) return ra;
  const resumeAt = e?.resumeAt ?? e?.resetAt;
  if (resumeAt) { const t = new Date(resumeAt).getTime() - Date.now(); if (t > 0) return t; }
  return Number(process.env.RATELIMIT_RESUME_DELAY_MS || 120000);
}

export function withTimeout<T>(fn: () => Promise<T>, ms: number, label = "op"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new RetryableError(`${label} timed out after ${ms}ms`)), ms);
    fn().then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { attempts?: number; baseMs?: number; label?: string } = {},
): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const base = opts.baseMs ?? 800;
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      if (e instanceof FatalError) throw e;                 // don't retry fatal
      if (i === attempts - 1) break;
      // Rate limits need much longer, gentler backoff (and honor Retry-After if given).
      const rl = isRateLimit(e);
      const ra = retryAfterMs(e);
      const delay = ra ?? (rl ? 5000 * 2 ** i : base * 2 ** i) + Math.floor(Math.random() * (rl ? 3000 : base));
      log.warn(`retry ${opts.label ?? "op"} in ${delay}ms`, { attempt: i + 1, rateLimited: rl, err: String((e as any)?.message || e) });
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

/** Minimal circuit breaker per dependency (e.g. "gemini", "youtube"). */
export class CircuitBreaker {
  private fails = 0; private openUntil = 0;
  constructor(private name: string, private threshold = 5, private cooldownMs = 60_000) {}
  assertClosed() {
    if (Date.now() < this.openUntil)
      throw new RetryableError(`circuit ${this.name} open for ${Math.round((this.openUntil - Date.now()) / 1000)}s`);
  }
  ok() { this.fails = 0; }
  fail() {
    if (++this.fails >= this.threshold) {
      this.openUntil = Date.now() + this.cooldownMs;
      this.fails = 0;
      log.error(`circuit ${this.name} OPEN`, { cooldownMs: this.cooldownMs });
    }
  }
  async run<T>(fn: () => Promise<T>): Promise<T> {
    this.assertClosed();
    try { const v = await fn(); this.ok(); return v; }
    catch (e) { this.fail(); throw e; }
  }
}
export const breakers = {
  gemini: new CircuitBreaker("gemini", 5, 60_000),
  youtube: new CircuitBreaker("youtube", 4, 120_000),
};

/** Atomically lease the next actionable job (see claim_next_job RPC). Returns null if none. */
export async function claimNextJob(): Promise<any | null> {
  const { data, error } = await supabase.rpc("claim_next_job", {
    worker_id: env().WORKER_ID,
    lease_seconds: env().LEASE_SECONDS,
  });
  if (error) { log.error("claim_next_job failed", { err: error.message }); return null; }
  return Array.isArray(data) ? data[0] ?? null : data ?? null;
}

/** Release expired leases so stuck/crashed jobs get retried. */
export async function reclaimStaleLocks(): Promise<number> {
  const { data, error } = await supabase.rpc("reclaim_stale_locks");
  if (error) { log.error("reclaim_stale_locks failed", { err: error.message }); return 0; }
  return (data as number) ?? 0;
}
