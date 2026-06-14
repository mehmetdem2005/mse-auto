import type { NotifyResult } from "./notifier";

/** Ek teslim kanalları (FCM push'a ek) — ADR-084. */
export type ChannelKind = "telegram" | "email" | "whatsapp";

export const CHANNEL_KINDS: ChannelKind[] = ["telegram", "email", "whatsapp"];

export interface ChannelMessage {
  title: string;
  body: string;
}

/** E-posta besteci portu (ADR-109): ham uyarıyı profesyonel e-postaya çevirir (LLM). */
export interface EmailComposer {
  compose(input: ChannelMessage): Promise<ChannelMessage>;
}

/**
 * Tek bir ek kanalın gönderici port'u. `target` kanala göre değişir:
 * telegram→chat_id, email→adres, whatsapp→E.164 numara.
 */
export interface ChannelSender {
  readonly kind: ChannelKind;
  send(target: string, msg: ChannelMessage): Promise<NotifyResult>;
}

/**
 * Kullanıcının hesap düzeyinde ek kanal tercihleri (nereye ulaşılsın).
 * PII zonu: e-posta/numara/chat_id kişisel veridir; paylaşılan hatta GİTMEZ.
 */
export interface UserChannels {
  telegramChatId: string | null;
  email: string | null;
  whatsappTo: string | null;
  /** Açık (etkin) kanallar — yalnız hedefi dolu olanlar gerçekten gönderilir. */
  enabled: ChannelKind[];
}

export const EMPTY_USER_CHANNELS: UserChannels = {
  telegramChatId: null,
  email: null,
  whatsappTo: null,
  enabled: [],
};

export interface UserChannelRepository {
  get(userId: string): Promise<UserChannels>;
  set(userId: string, channels: UserChannels): Promise<void>;
}

/** Bir kullanıcı için açık + hedefi dolu kanalların (kind, target) çiftleri. */
export function resolveTargets(ch: UserChannels): Array<{ kind: ChannelKind; target: string }> {
  const out: Array<{ kind: ChannelKind; target: string }> = [];
  const set = new Set(ch.enabled);
  if (set.has("telegram") && ch.telegramChatId) {
    out.push({ kind: "telegram", target: ch.telegramChatId });
  }
  if (set.has("email") && ch.email) out.push({ kind: "email", target: ch.email });
  if (set.has("whatsapp") && ch.whatsappTo) out.push({ kind: "whatsapp", target: ch.whatsappTo });
  return out;
}
