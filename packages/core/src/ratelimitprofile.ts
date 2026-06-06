/**
 * Rate-limit knowledge + governor.  [v0.8]
 * The manager uses these (verified Jun 2026 free-tier approximations; override via RATE_LIMITS_JSON)
 * to throttle how many specialist agents run in parallel and how fast, so the crew does NOT hit limits.
 */
export interface RlProfile { rpm: number; tpm: number; rpd: number; }
export const GEMINI_FREE: Record<string, RlProfile> = {
  text: { rpm: 10, tpm: 250000, rpd: 1000 },
  reasoning: { rpm: 5, tpm: 100000, rpd: 100 },
  embed: { rpm: 100, tpm: 30000, rpd: 1000 },
};
export const YOUTUBE_DAILY_UNITS = 10000;

/** Safe parallelism + min spacing (ms) for a resource given how many agents want it. */
export function governor(p: RlProfile, agents: number): { maxParallel: number; minIntervalMs: number } {
  const maxParallel = Math.max(1, Math.min(agents, Math.floor(p.rpm / 2) || 1));
  const minIntervalMs = Math.ceil(60000 / Math.max(1, p.rpm)) + 1;
  return { maxParallel, minIntervalMs };
}
