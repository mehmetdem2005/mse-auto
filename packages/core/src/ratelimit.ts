/**
 * Precise client-side rate limiter.  [v0.4]
 *
 * Real Gemini limits (free tier after the Dec 2025 cuts, verified June 2026):
 *   Flash ≈ 10 RPM / 250k TPM / 250–1500 RPD · Pro ≈ 5 RPM / 100 RPD · embeddings high.
 *   Tier 1 (billing on) ≈ 150–300 RPM. Limits are multi-dimensional (RPM/TPM/RPD/IPM),
 *   enforced per-project with a token bucket; exceeding any → 429 RESOURCE_EXHAUSTED.
 *
 * Design (per the request): pace requests to EXACTLY one millisecond above the limit's
 * minimum interval, so we ride just under the cap without ever crossing it:
 *     minIntervalMs = floor(60_000 / RPM) + 1
 * e.g. 10 RPM → 6001 ms between calls; 300 RPM → 201 ms. We ALSO enforce a rolling 60s
 * request window, a rolling 60s token window (TPM), and a per-UTC-day cap (RPD) as belts.
 *
 * Numbers are configurable: set RATE_LIMITS_JSON to your tier's real values. Defaults are
 * conservative free-tier so a fresh project can't get 429-throttled out of the box.
 *
 * NOTE: this is in-process (correct for the single worker). For multiple workers, back the
 * counters with Redis/Postgres — see RESEARCH.md.
 */
import { log } from "./logger.js";

export interface Limit { rpm: number; tpm?: number; rpd?: number; ipm?: number; }

const DEFAULTS: Record<string, Limit> = {
  "gemini-text": { rpm: 10, tpm: 250_000, rpd: 1500 },
  "gemini-reasoning": { rpm: 5, tpm: 250_000, rpd: 100 },
  "gemini-image": { rpm: 10, ipm: 10, rpd: 100 },
  "gemini-embed": { rpm: 100, tpm: 1_000_000, rpd: 1000 },
  "gemini-tts": { rpm: 3, rpd: 50 },
  "youtube-write": { rpm: 6 },   // stay well under per-100s limits; daily units capped in budget.ts
};

export class RateLimitExceeded extends Error {
  constructor(public resource: string, public dimension: "rpd") { super(`Rate limit (${dimension}) reached for ${resource}`); }
}

interface State { lastAt: number; reqWindow: number[]; tokWindow: [number, number][]; dayCount: number; dayStart: number; }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class RateLimiter {
  private cachedJson?: string;
  private cachedLimits: Record<string, Limit> = DEFAULTS;
  private state = new Map<string, State>();
  private queue = new Map<string, Promise<void>>(); // serialize acquires per resource

  /** Merge DEFAULTS with RATE_LIMITS_JSON, re-parsing only when the env value changes. */
  private resolve(key: string): Limit {
    const j = process.env.RATE_LIMITS_JSON;
    if (j !== this.cachedJson) {
      this.cachedJson = j;
      try { this.cachedLimits = j ? { ...DEFAULTS, ...JSON.parse(j) } : DEFAULTS; }
      catch { log.warn("RATE_LIMITS_JSON invalid — using defaults"); this.cachedLimits = DEFAULTS; }
    }
    return this.cachedLimits[key] ?? { rpm: 60 };
  }
  private st(key: string): State {
    let s = this.state.get(key);
    const now = Date.now();
    if (!s) { s = { lastAt: 0, reqWindow: [], tokWindow: [], dayCount: 0, dayStart: dayStartUtc(now) }; this.state.set(key, s); }
    if (dayStartUtc(now) !== s.dayStart) { s.dayStart = dayStartUtc(now); s.dayCount = 0; }
    return s;
  }

  /** Wait until it's safe to make a call against `key`. Resolves when the slot is yours. */
  async acquire(key: string, opts: { tokens?: number; images?: number } = {}): Promise<void> {
    // serialize per-resource so concurrent callers are paced correctly
    const prev = this.queue.get(key) ?? Promise.resolve();
    let release!: () => void;
    const mine = new Promise<void>((r) => (release = r));
    this.queue.set(key, prev.then(() => mine));
    await prev;
    try { await this.doAcquire(key, opts); } finally { release(); }
  }

  private async doAcquire(key: string, opts: { tokens?: number; images?: number }) {
    const lim = this.resolve(key);
    const s = this.st(key);
    const now = Date.now();

    if (lim.rpd && s.dayCount >= lim.rpd) throw new RateLimitExceeded(key, "rpd");

    // 1) +1ms pacing
    const minInterval = Math.floor(60_000 / lim.rpm) + 1;
    let wait = Math.max(0, s.lastAt + minInterval - now);

    // 2) rolling 60s request window
    s.reqWindow = s.reqWindow.filter((t) => t > now - 60_000);
    if (s.reqWindow.length >= lim.rpm) wait = Math.max(wait, s.reqWindow[0] + 60_001 - now);

    // 3) rolling 60s token window (TPM)
    if (lim.tpm && opts.tokens) {
      s.tokWindow = s.tokWindow.filter(([t]) => t > now - 60_000);
      const used = s.tokWindow.reduce((a, [, n]) => a + n, 0);
      if (used + opts.tokens > lim.tpm && s.tokWindow.length)
        wait = Math.max(wait, s.tokWindow[0][0] + 60_001 - now);
    }

    if (wait > 0) { log.debug("rate pacing", { key, waitMs: wait }); await sleep(wait); }

    const t = Date.now();
    s.lastAt = t; s.reqWindow.push(t); s.dayCount++;
    if (lim.tpm && opts.tokens) s.tokWindow.push([t, opts.tokens]);
  }

  snapshot() {
    const out: Record<string, { dayCount: number; rpd?: number; reqLastMin: number; rpm: number }> = {};
    for (const [k, s] of this.state) out[k] = { dayCount: s.dayCount, rpd: this.resolve(k).rpd, reqLastMin: s.reqWindow.filter((t) => t > Date.now() - 60_000).length, rpm: this.resolve(k).rpm };
    return out;
  }
}

function dayStartUtc(ms: number) { const d = new Date(ms); d.setUTCHours(0, 0, 0, 0); return d.getTime(); }
export const limiter = new RateLimiter();
