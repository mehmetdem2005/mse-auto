/**
 * Alerting (P0 from the v0.2 roadmap). When something needs a human — a job hit dead-letter,
 * the budget guard paused the pipeline, or a circuit opened — push a message to a webhook so
 * you find out without staring at the dashboard. Works with Slack/Discord/Telegram-style
 * incoming webhooks (they all accept a JSON body; we send a generic `text`/`content`).
 */
import { env } from "./env.js";
import { log } from "./logger.js";

export type AlertLevel = "info" | "warn" | "critical";

export async function alert(level: AlertLevel, title: string, detail?: string) {
  const url = env().ALERT_WEBHOOK_URL;
  const emoji = level === "critical" ? "🔴" : level === "warn" ? "🟠" : "🔵";
  const text = `${emoji} [Auto-Shorts] ${title}${detail ? `\n${detail}` : ""}`;
  log.child({ level }).warn(`alert:${title}`, { detail });
  if (!url) return; // no webhook configured — log only
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // `text` (Slack), `content` (Discord), `text` (Telegram-bot via proxy) — send both keys.
      body: JSON.stringify({ text, content: text }),
    });
  } catch (e) {
    log.error("alert webhook failed", { err: String(e) });
  }
}
