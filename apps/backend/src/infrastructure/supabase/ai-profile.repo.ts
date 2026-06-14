import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiProfileRepository, UserAiProfile } from "../../domain/ai-profile";
import type { Database } from "./database.types";

/** AI kişiselleştirme — profiles.ai_about / ai_attention (ADR-113). Service-role. */
export class SupabaseAiProfileRepository implements AiProfileRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async get(userId: string): Promise<UserAiProfile> {
    const { data, error } = await this.db
      .from("profiles")
      .select("ai_about, ai_attention")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(`ai-profile get: ${error.message}`);
    return { about: data?.ai_about ?? "", attention: data?.ai_attention ?? "" };
  }

  async set(userId: string, profile: UserAiProfile): Promise<void> {
    // profiles satırı trigger'sız boş kalabiliyor → upsert (id PK).
    const { error } = await this.db.from("profiles").upsert(
      {
        id: userId,
        ai_about: profile.about.trim() || null,
        ai_attention: profile.attention.trim() || null,
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(`ai-profile set: ${error.message}`);
  }
}
