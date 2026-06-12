import type { Logger } from "../../domain/logger";

type Level = "info" | "warn" | "error";

function emit(level: Level, msg: string, fields?: Record<string, unknown>): void {
  const line = JSON.stringify({ level, msg, time: new Date().toISOString(), ...(fields ?? {}) });
  if (level === "error") console.error(line);
  else console.log(line);
}

/** Yapılandırılmış JSON log → stdout/stderr (12-factor). Toplayıcı dostu. */
export const logger: Logger = {
  info: (m, f) => emit("info", m, f),
  warn: (m, f) => emit("warn", m, f),
  error: (m, f) => emit("error", m, f),
};
