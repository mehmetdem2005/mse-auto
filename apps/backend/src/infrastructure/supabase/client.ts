import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/** Service-role client (RLS bypass) — backend pipeline + yazma yolları için. Tipli (Database). */
export function createSupabaseAdminClient(
  url: string,
  serviceRoleKey: string,
): SupabaseClient<Database> {
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
