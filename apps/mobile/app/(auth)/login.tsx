import { Btn, Field } from "@/components/ui";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/stores/auth";
import { useState } from "react";
import { ActivityIndicator, SafeAreaView, Text, TextInput, View } from "react-native";

export default function Login() {
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [devId, setDevId] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn() {
    if (!supabase) return;
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr(error.message);
    setBusy(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0c10" }}>
      <View className="flex-1 justify-center px-6">
        <View className="flex-row items-center gap-3 mb-8">
          <View className="w-3 h-3 rounded-full bg-accent" />
          <View>
            <Text className="text-text text-lg font-bold tracking-widest">WATCHER</Text>
            <Text className="text-muted text-[10px] tracking-[3px] uppercase">ops console</Text>
          </View>
        </View>
        <Text className="text-text text-2xl font-bold mb-1">Oturum aç</Text>
        <Text className="text-muted text-xs mb-6">
          {supabaseConfigured
            ? "supabase hesabınla giriş yap"
            : "geliştirme modu · kullanıcı kimliği"}
        </Text>
        {err ? <Text className="text-neg text-xs mb-4">{err}</Text> : null}

        {supabaseConfigured ? (
          <>
            <Field label="e-posta">
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="admin@watcher.app"
                placeholderTextColor="#5c6470"
                className="bg-panel border border-line rounded-lg px-3 py-3 text-text"
              />
            </Field>
            <Field label="parola">
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#5c6470"
                className="bg-panel border border-line rounded-lg px-3 py-3 text-text"
              />
            </Field>
            <Btn onPress={signIn} disabled={busy || !email || !password}>
              {busy ? (
                <ActivityIndicator color="#1a1205" />
              ) : (
                <Text className="text-ink font-semibold uppercase tracking-wider text-xs">
                  giriş
                </Text>
              )}
            </Btn>
          </>
        ) : (
          <>
            <Field label="dev kullanıcı kimliği">
              <TextInput
                value={devId}
                onChangeText={setDevId}
                autoCapitalize="none"
                placeholder="admin_demo"
                placeholderTextColor="#5c6470"
                className="bg-panel border border-line rounded-lg px-3 py-3 text-text"
              />
            </Field>
            <Btn
              onPress={() => setSession({ token: devId.trim(), email: null, userId: devId.trim() })}
              disabled={!devId}
            >
              <Text className="text-ink font-semibold uppercase tracking-wider text-xs">giriş</Text>
            </Btn>
            <Text className="text-muted text-[11px] mt-4">
              backend DevAuthVerifier · token = kullanıcı kimliği
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
