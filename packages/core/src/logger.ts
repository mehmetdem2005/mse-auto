/**
 * Structured logger. Emits one JSON object per line so any aggregator (Logflare, Datadog,
 * Render logs, Better Stack) can parse it. Carries context (traceId, jobId, stage) and
 * redacts anything that looks like a secret. No dependency — swap for pino if you prefer.
 */
import { env } from "./env.js";

type Level = "debug" | "info" | "warn" | "error";
const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const SECRET_RX = /(key|token|secret|password|authorization)/i;
function redact(obj: Record<string, unknown> = {}) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = SECRET_RX.test(k) && typeof v === "string" ? `***${String(v).slice(-4)}` : v;
  }
  return out;
}

export interface LogContext { traceId?: string; jobId?: string; stage?: string; [k: string]: unknown; }

class Logger {
  constructor(private ctx: LogContext = {}) {}
  child(ctx: LogContext) { return new Logger({ ...this.ctx, ...ctx }); }
  private emit(level: Level, msg: string, extra?: Record<string, unknown>) {
    if (ORDER[level] < ORDER[(env().LOG_LEVEL as Level) || "info"]) return;
    const line = { t: new Date().toISOString(), level, msg, ...redact(this.ctx as any), ...redact(extra) };
    const s = JSON.stringify(line);
    (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(s);
  }
  debug(m: string, e?: Record<string, unknown>) { this.emit("debug", m, e); }
  info(m: string, e?: Record<string, unknown>) { this.emit("info", m, e); }
  warn(m: string, e?: Record<string, unknown>) { this.emit("warn", m, e); }
  error(m: string, e?: Record<string, unknown>) { this.emit("error", m, e); }
}

export const log = new Logger();
export const newTraceId = () => `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
