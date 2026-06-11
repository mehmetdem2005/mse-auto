import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type ChannelKind,
  EMPTY_USER_CHANNELS,
  type UserChannelRepository,
  type UserChannels,
} from "../../domain/channels";
import type { Database } from "./database.types";

/**
 * Ek-kanal tercihleri (ADR-084) — PII zonu (e-posta/numara/chat_id).
 * Tablo: user_channels (user_id PK). RLS: yalnız sahibi; backend service-role.
 * Migration 0011 uygulanmadıysa graceful: hata → boş tercih (kanal kapalı).
 */
export class SupabaseUserChannelRepository implements UserChannelRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async get(userId: string): Promise<UserChannels> {
    const { data, error } = await this.db
      .from("user_channels")
      .select("telegram_chat_id, email, whatsapp_to, enabled")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return EMPTY_USER_CHANNELS;
    return {
      telegramChatId: data.telegram_chat_id ?? null,
      email: data.email ?? null,
      whatsappTo: data.whatsapp_to ?? null,
      enabled: Array.isArray(data.enabled) ? (data.enabled as ChannelKind[]) : [],
    };
  }

  async set(userId: string, ch: UserChannels): Promise<void> {
    const { error } = await this.db.from("user_channels").upsert(
      {
        user_id: userId,
        telegram_chat_id: ch.telegramChatId,
        email: ch.email,
        whatsapp_to: ch.whatsappTo,
        enabled: ch.enabled,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(`user_channels set: ${error.message}`);
  }
}
