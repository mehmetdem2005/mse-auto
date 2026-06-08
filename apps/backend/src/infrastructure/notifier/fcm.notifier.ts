import type { Notifier, NotifyResult, PushMessage } from "../../domain/notifier";
import type { AccessTokenProvider } from "./token";

interface FcmErrorResponse {
  error?: { message?: string };
}

/** FCM HTTP v1 — POST /v1/projects/{projectId}/messages:send, Bearer OAuth2. */
export class FcmNotifier implements Notifier {
  constructor(
    private readonly projectId: string,
    private readonly tokenProvider: AccessTokenProvider,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async send(message: PushMessage): Promise<NotifyResult> {
    const accessToken = await this.tokenProvider.getToken();
    const url = `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`;
    const fcmMessage: Record<string, unknown> = {
      token: message.token,
      notification: { title: message.title, body: message.body },
    };
    if (message.data) fcmMessage.data = message.data;

    const res = await this.fetchImpl(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: fcmMessage }),
    });
    if (res.ok) return { success: true };

    let detail = `fcm ${res.status}`;
    try {
      const err = (await res.json()) as FcmErrorResponse;
      if (err.error?.message) detail = err.error.message;
    } catch {
      /* gövde yoksa status kalır */
    }
    return { success: false, error: detail };
  }
}
