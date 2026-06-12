import type { Logger } from "../../domain/logger";
import type { Notifier, NotifyResult, PushMessage } from "../../domain/notifier";

/** FCM yapılandırılmamışken (dev) — push'u loglar, başarı döner. */
export class NoopNotifier implements Notifier {
  constructor(private readonly logger?: Logger) {}

  async send(message: PushMessage): Promise<NotifyResult> {
    const tokenPreview = message.token.length > 8 ? `${message.token.slice(0, 8)}…` : message.token;
    this.logger?.info("noop_push", { to: tokenPreview, title: message.title, body: message.body });
    return { success: true };
  }
}
