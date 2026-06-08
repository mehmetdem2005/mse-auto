import type { Notifier, NotifyResult, PushMessage } from "../../domain/notifier";

/** FCM yapılandırılmamışken (dev) — push'u loglar, başarı döner. */
export class NoopNotifier implements Notifier {
  async send(message: PushMessage): Promise<NotifyResult> {
    const tokenPreview = message.token.length > 8 ? `${message.token.slice(0, 8)}…` : message.token;
    console.log(`(noop push) → ${tokenPreview}: ${message.title} — ${message.body}`);
    return { success: true };
  }
}
