import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Use the SERVICE ROLE key on the server/worker only. Never ship it to the browser.
// Lazily instantiated: the client is created on first use, not at import time, so
// `next build` / module evaluation doesn't fail when env vars are absent.
let _client: SupabaseClient | null = null;

function client(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const value = (client() as any)[prop];
    return typeof value === "function" ? value.bind(client()) : value;
  },
});
