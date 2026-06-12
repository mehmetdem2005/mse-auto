/**
 * Log portu (hexagonal): application/interface katmanları YALNIZ bu arabirimi
 * bilir; somut adaptör `infrastructure/logging/logger`dadır. Böylece iş mantığı
 * log uygulamasına (stdout/JSON/aggregator) bağlanmaz.
 */
export interface Logger {
  info(msg: string, fields?: Record<string, unknown>): void;
  warn(msg: string, fields?: Record<string, unknown>): void;
  error(msg: string, fields?: Record<string, unknown>): void;
}
