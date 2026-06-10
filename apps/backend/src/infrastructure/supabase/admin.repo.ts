import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminRepository } from "../../domain/billing";
import type { Database } from "./database.types";

export class SupabaseAdminRepository implements AdminRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}
  async isAdmin(userId: string): Promise<boolean> {
    const { data, error } = await this.db
      .from("admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(`isAdmin: ${error.message}`);
    return data !== null;
  }

  async listAdminIds(): Promise<string[]> {
    const { data, error } = await this.db.from("admins").select("user_id");
    if (error) throw new Error(`listAdminIds: ${error.message}`);
    return (data ?? []).map((r) => r.user_id);
  }
}
