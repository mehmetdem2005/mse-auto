import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anon);
export const supabase = supabaseConfigured
  ? createClient(url as string, anon as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // OAuth (Google, ADR-093): PKCE akışı; web'de dönüş URL'sindeki kod otomatik
        // oturuma çevrilir, native'de exchangeCodeForSession elle çağrılır (login.tsx).
        flowType: "pkce",
        detectSessionInUrl: Platform.OS === "web",
      },
    })
  : null;
