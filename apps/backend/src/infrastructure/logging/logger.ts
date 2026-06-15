import type { Logger } from "../../domain/logger";

type Level = "info" | "warn" | "error";

/**
 * PII redaksiyonu (ADR-141) — yapısal logların SON kapısı. Çağrı yerleri zaten disiplinli (e-posta/
 * tam token/auth başlığı loglanmaz), AMA yakalanmayan hata yolu `error.message`/`stack` loglar ve bunlar
 * kullanıcı girdisini gömebilir (fırlatılan istisna, doğrulama yankısı). Bu, P1 "0 PII egress" için
 * derinlemesine-savunma: anahtar-adı duyarlıysa değeri tamamen, değilse string içindeki PII desenini maskeler.
 */
const SENSITIVE_KEY =
  /(authorization|cookie|password|secret|token|apikey|api[_-]?key|bearer|jwt|email|e-?posta|raw[_-]?intent|service[_-]?role|access[_-]?token|refresh[_-]?token|anon[_-]?key)/i;
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const BEARER_RE = /Bearer\s+[A-Za-z0-9._-]+/gi;
/** JWT (eyJ…) · sağlayıcı anahtar önekleri (sk-/sbp_/rnd_/whsec_…) · 40+ karakterlik genel jeton. */
const TOKEN_RE =
  /\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9._-]{6,}|\b(?:sk|pk|rk)[-_][A-Za-z0-9]{12,}|\b(?:sbp|rnd|whsec|ghp|gho|xoxb)_[A-Za-z0-9]{8,}|\b[A-Za-z0-9_-]{40,}\b/g;

function maskString(s: string): string {
  return s
    .replace(BEARER_RE, "Bearer [redacted]")
    .replace(EMAIL_RE, "[email]")
    .replace(TOKEN_RE, "[token]");
}

function redactValue(key: string, val: unknown, depth: number): unknown {
  if (SENSITIVE_KEY.test(key)) return "[redacted]";
  if (typeof val === "string") return maskString(val);
  if (depth >= 4 || val === null || typeof val !== "object") return val;
  if (Array.isArray(val)) return val.map((v) => redactValue(key, v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
    out[k] = redactValue(k, v, depth + 1);
  }
  return out;
}

/** Log alanlarını PII'dan arındır (anahtar-bazlı tam redaksiyon + string-içi desen maskesi). */
export function redactPii(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) out[k] = redactValue(k, v, 0);
  return out;
}

function emit(level: Level, msg: string, fields?: Record<string, unknown>): void {
  const safe = fields ? redactPii(fields) : undefined;
  const line = JSON.stringify({ level, msg, time: new Date().toISOString(), ...(safe ?? {}) });
  if (level === "error") console.error(line);
  else console.log(line);
}

/** Yapılandırılmış JSON log → stdout/stderr (12-factor). Toplayıcı dostu; PII redaksiyonlu (ADR-141). */
export const logger: Logger = {
  info: (m, f) => emit("info", m, f),
  warn: (m, f) => emit("warn", m, f),
  error: (m, f) => emit("error", m, f),
};
