/**
 * Centralized, validated configuration. Fail fast with a clear message instead of
 * cryptic runtime errors deep in the pipeline. Also the single source of truth for
 * operational limits (timeouts, retries, budgets) so they're tunable in one place.
 */
import { z } from "zod";

const Env = z.object({
  GEMINI_API_KEY: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),

  YOUTUBE_CLIENT_ID: z.string().optional(),
  YOUTUBE_CLIENT_SECRET: z.string().optional(),
  YOUTUBE_REDIRECT_URI: z.string().optional(),
  YOUTUBE_REFRESH_TOKEN: z.string().optional(),

  GEMINI_TEXT_MODEL: z.string().default("gemini-3.5-flash"),
  GEMINI_REASONING_MODEL: z.string().default("gemini-3.1-pro-preview"),
  GEMINI_IMAGE_MODEL: z.string().default("gemini-3.1-flash-image-preview"),
  GEMINI_EMBED_MODEL: z.string().default("gemini-embedding-001"),
  GEMINI_TTS_MODEL: z.string().default("gemini-3.1-flash-tts-preview"),
  EMBED_DIM: z.coerce.number().default(768),
  TTS_VOICE: z.string().default("Kore"),

  WORK_DIR: z.string().default("/tmp/shorts"),
  WORKER_ID: z.string().default(`worker-${Math.random().toString(36).slice(2, 8)}`),
  TICK_MS: z.coerce.number().default(300_000),
  LEASE_SECONDS: z.coerce.number().default(900),     // job lock TTL
  ORIGINALITY_THRESHOLD: z.coerce.number().default(0.9),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  // Cost / quota governance (per UTC day). 0 = unlimited (not recommended).
  DAILY_USD_CAP: z.coerce.number().default(5),
  DAILY_YOUTUBE_UNITS_CAP: z.coerce.number().default(8000), // < 10k default quota

  // v0.3 additions
  YOUTUBE_DEFAULT_PRIVACY: z.enum(["private", "unlisted", "public"]).default("private"),
  SESSION_SECRET: z.string().optional(),   // HMAC key for the signed login cookie
  ALERT_WEBHOOK_URL: z.string().url().optional(), // Slack/Discord/Telegram-style incoming webhook
  WORKER_TOKEN: z.string().optional(),     // shared secret to trigger /tick over HTTP
  PORT: z.coerce.number().default(8080),

  // v0.4 — editorial agent board + precise rate limits
  REVIEW_MODEL: z.string().optional(),     // model for the ≥5 auditors (default: text model)
  REVISE_MODEL: z.string().optional(),     // model for revisions (default: reasoning model)
  REVIEWER_QUORUM: z.coerce.number().default(5),     // ≥ this many passes to auto-approve
  MAX_REVISE_ROUNDS: z.coerce.number().default(2),   // revise attempts before escalating to human
  RATE_LIMITS_JSON: z.string().optional(), // JSON map to override per-resource {rpm,tpm,rpd,ipm}

  // v0.5 — agent swarm orchestration
  AGENT_MODE: z.enum(["swarm", "board"]).default("swarm"),
  SWARM_MAX_PARALLEL: z.coerce.number().default(3),
  SWARM_STEP_BUDGET: z.coerce.number().default(40),
  SWARM_RETRIES: z.coerce.number().default(1),
  SWARM_REPLAN_ROUNDS: z.coerce.number().default(1),
  AGENT_GUARDRAILS: z.enum(["on", "off"]).default("on"),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_OWNER: z.string().optional(),
  GITHUB_REPO: z.string().optional(),
  GITHUB_BASE_BRANCH: z.string().default("main"),
  GITHUB_API_VERSION: z.string().optional(),
  SELF_IMPROVE_ENABLED: z.enum(["on", "off"]).default("off"),
  SELF_IMPROVE_AUTOMERGE: z.enum(["on", "off"]).default("off"),
  MONITOR_ENABLED: z.enum(["on", "off"]).default("on"),
  AUTONOMY_EVERY_TICKS: z.coerce.number().default(20),
  RATELIMIT_RESUME_DELAY_MS: z.coerce.number().default(120000),
  AUTONOMY_FULL: z.enum(["on", "off"]).default("off"),
  COMPETITOR_VIDEO_IDS: z.string().optional(),
  CORE_SRC_DIR: z.string().default("packages/core/src"),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  SELF_IMPROVE_CODE: z.enum(["on", "off"]).default("off"),
  PROMPTLAB_ENABLED: z.enum(["on", "off"]).default("off"),
  ANOMALY_AUTONOMY: z.enum(["on", "off"]).default("on"),
  CANARY_WINDOW_MIN: z.coerce.number().default(30),
  CANARY_ERROR_DELTA: z.coerce.number().default(0.15),
});

// Validate lazily so importing the lib in a context missing some keys (e.g. the web's
// read-only pages) doesn't crash; call assertEnv() in entrypoints (worker, route handlers).
let cached: z.infer<typeof Env> | null = null;
export function env() {
  if (cached) return cached;
  const parsed = Env.safeParse(process.env);
  if (!parsed.success) {
    // partial defaults still usable for read paths; log the problems.
    console.warn("[env] validation issues:", parsed.error.flatten().fieldErrors);
    cached = Env.parse({ ...process.env }); // throws only on truly required missing
  } else {
    cached = parsed.data;
  }
  return cached!;
}

export function assertEnv() {
  const e = Env.safeParse(process.env);
  if (!e.success) throw new Error("Invalid environment:\n" + JSON.stringify(e.error.flatten().fieldErrors, null, 2));
  return e.data;
}

// Rough cost model for budget accounting (USD). Tune to current pricing.
export const COST = {
  textPer1kTokens: 0.0015,
  reasoningPer1kTokens: 0.012,
  imagePerCall: 0.03,
  ttsPer1kChars: 0.012,
  embedPer1kTokens: 0.0001,
};

// Stage timeouts (ms) — a hung external call must not freeze the pipeline.
export const TIMEOUTS = {
  draft: 120_000,
  render: 300_000,
  upload: 600_000,
  analytics: 60_000,
};
