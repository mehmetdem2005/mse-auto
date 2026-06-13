import type { SupabaseClient } from "@supabase/supabase-js";
import type { SettingsRepository } from "../../domain/settings";
import type { Database, Json } from "./database.types";

/** Tablo henüz canlıda yoksa (migration 0014 uygulanmadıysa) Postgres bu kodu döner. */
const UNDEFINED_TABLE = "42P01";

export class SupabaseSettingsRepository implements SettingsRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async get(key: string): Promise<unknown | null> {
    const { data, error } = await this.db
      .from("app_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) {
      // Tablo yoksa "ayar yok" say — migration uygulanana dek varsayılanla çalışılır.
      if (error.code === UNDEFINED_TABLE) return null;
      throw new Error(`settings.get: ${error.message}`);
    }
    return data?.value ?? null;
  }

  async set(key: string, value: unknown): Promise<boolean> {
    const { error } = await this.db
      .from("app_settings")
      .upsert({ key, value: value as Json, updated_at: new Date().toISOString() });
    if (error) {
      if (error.code === UNDEFINED_TABLE) return false; // dürüst: kalıcı yazılamadı
      throw new Error(`settings.set: ${error.message}`);
    }
    return true;
  }
}
