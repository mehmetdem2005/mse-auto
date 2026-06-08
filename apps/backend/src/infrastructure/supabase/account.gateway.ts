import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccountGateway } from "../../domain/account";
import type { Database } from "./database.types";

/** Auth kullanıcısını siler → tüm PII tabloları ON DELETE CASCADE ile temizlenir (0001_init). */
export class SupabaseAccountGateway implements AccountGateway {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async deleteAccount(userId: string): Promise<void> {
    const { error } = await this.db.auth.admin.deleteUser(userId);
    if (error) throw new Error(`hesap silme: ${error.message}`);
  }
}
