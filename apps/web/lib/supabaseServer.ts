import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only client (service role). Used in server components / route handlers.
// Lazily instantiated so `next build` doesn't fail when env vars are absent.
let _client: SupabaseClient | null = null;

function client(): SupabaseClient {
  if (_client) return _client;
  _client = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  return _client;
}

export const db: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const value = (client() as any)[prop];
    return typeof value === "function" ? value.bind(client()) : value;
  },
});
