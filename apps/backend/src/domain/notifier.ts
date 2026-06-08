export interface PushMessage {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface NotifyResult {
  success: boolean;
  error?: string;
}

/** Push bildirim port'u (FCM). */
export interface Notifier {
  send(message: PushMessage): Promise<NotifyResult>;
}
