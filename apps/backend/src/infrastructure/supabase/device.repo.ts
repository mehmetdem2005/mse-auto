import type { SupabaseClient } from "@supabase/supabase-js";
import type { DeviceRepository } from "../../domain/device";
import type { Database } from "./database.types";

export class SupabaseDeviceRepository implements DeviceRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async save(input: { userId: string; token: string; platform: string }): Promise<void> {
    const { error } = await this.db
      .from("device_tokens")
      .upsert(
        { user_id: input.userId, fcm_token: input.token, platform: input.platform },
        { onConflict: "user_id,fcm_token" },
      );
    if (error) throw new Error(`device save: ${error.message}`);
  }

  async listTokens(userId: string): Promise<string[]> {
    const { data, error } = await this.db
      .from("device_tokens")
      .select("fcm_token")
      .eq("user_id", userId);
    if (error) throw new Error(`device list: ${error.message}`);
    return (data ?? []).map((r) => r.fcm_token);
  }
}
