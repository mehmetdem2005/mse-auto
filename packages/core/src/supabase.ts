import { createClient } from "@supabase/supabase-js";

// Use the SERVICE ROLE key on the server/worker only. Never ship it to the browser.
const url = process.env.SUPABASE_URL!;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});
