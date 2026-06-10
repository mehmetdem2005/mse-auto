import { Field } from "@/components/ui";
import { useReduceMotion } from "@/lib/reduce-motion";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/stores/auth";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight, Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

export default function Login() {
  const reduce = useReduceMotion();
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [devId, setDevId] = useState("");
  const [showPass, setShowPass] = useState(false);
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

  const enter = (delay: number) =>
    reduce ? undefined : FadeInDown.delay(delay).springify().damping(18).stiffness(180);

  return (
    <View className="flex-1 bg-ink">
      {/* Üst marka bloğu — derinlikli gradyan (premium ilk izlenim) */}
      <LinearGradient
        colors={["#6366F1", "#7C3AED", "#4F46E5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 72, paddingBottom: 96, paddingHorizontal: 24 }}
      >
        <Animated.View entering={reduce ? undefined : FadeIn.duration(500)}>
          <View className="flex-row items-center gap-3">
            <View
              className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center"
              style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" }}
            >
              <Text className="text-white text-2xl font-extrabold">W</Text>
            </View>
            <View>
              <Text className="text-white text-xl font-extrabold tracking-tight">Whenly</Text>
              <Text className="text-white/70 text-[11px] tracking-[2px] uppercase">
                akıllı izleyici
              </Text>
            </View>
          </View>
          <Text className="text-white text-[26px] font-extrabold leading-8 mt-7">
            İzlemek istediğin{"\n"}her şey, anında.
          </Text>
          <Text className="text-white/80 text-[13px] mt-2 leading-5">
            Yapay zekâ konunu sürekli takip eder; gelişme olduğu an haber verir.
          </Text>
        </Animated.View>
      </LinearGradient>

      {/* Form kartı — gradyanın üstüne binen yükseltilmiş yüzey */}
      <SafeAreaView className="flex-1" style={{ marginTop: -56 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <ScrollView contentContainerClassName="px-6 pb-10" keyboardShouldPersistTaps="handled">
            <Animated.View
              entering={enter(80)}
              className="bg-panel rounded-3xl p-6 border border-line"
              style={{
                shadowColor: "#0F172A",
                shadowOpacity: 0.1,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 12 },
                elevation: 8,
              }}
            >
              <Text className="text-text text-xl font-bold">Oturum aç</Text>
              <Text className="text-muted text-[13px] mt-1 mb-5">
                {supabaseConfigured
                  ? "Hesabınla giriş yap, kaldığın yerden devam et."
                  : "Geliştirme modu · kullanıcı kimliği"}
              </Text>

              {err ? (
                <Animated.View
                  entering={reduce ? undefined : FadeIn}
                  className="bg-neg/10 border border-neg/30 rounded-xl px-3 py-2.5 mb-4"
                >
                  <Text className="text-neg text-xs">{err}</Text>
                </Animated.View>
              ) : null}

              {supabaseConfigured ? (
                <>
                  <Field label="e-posta">
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      autoComplete="email"
                      keyboardType="email-address"
                      placeholder="ornek@whenly.app"
                      placeholderTextColor="#94A3B8"
                      className="bg-ink border border-line rounded-xl px-4 py-3.5 text-text text-[15px]"
                    />
                  </Field>
                  <Field label="parola">
                    <View className="flex-row items-center bg-ink border border-line rounded-xl pr-2">
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPass}
                        autoComplete="password"
                        placeholder="••••••••"
                        placeholderTextColor="#94A3B8"
                        accessibilityLabel="parola"
                        className="flex-1 px-4 py-3.5 text-text text-[15px]"
                      />
                      <Pressable
                        onPress={() => setShowPass((v) => !v)}
                        accessibilityRole="button"
                        accessibilityLabel={showPass ? "Parolayı gizle" : "Parolayı göster"}
                        className="w-11 h-11 items-center justify-center"
                      >
                        {showPass ? (
                          <EyeOff size={18} color="#64748B" />
                        ) : (
                          <Eye size={18} color="#64748B" />
                        )}
                      </Pressable>
                    </View>
                  </Field>
                  <PrimaryButton
                    label="Giriş yap"
                    busy={busy}
                    disabled={busy || !email || !password}
                    onPress={signIn}
                  />
                </>
              ) : (
                <>
                  <Field label="dev kullanıcı kimliği">
                    <TextInput
                      value={devId}
                      onChangeText={setDevId}
                      autoCapitalize="none"
                      placeholder="admin_demo"
                      placeholderTextColor="#94A3B8"
                      className="bg-ink border border-line rounded-xl px-4 py-3.5 text-text text-[15px]"
                    />
                  </Field>
                  <PrimaryButton
                    label="Giriş yap"
                    busy={false}
                    disabled={!devId}
                    onPress={() =>
                      setSession({ token: devId.trim(), email: null, userId: devId.trim() })
                    }
                  />
                  <Text className="text-muted text-[11px] mt-4 text-center">
                    Geliştirme · token = kullanıcı kimliği
                  </Text>
                </>
              )}
            </Animated.View>

            <Animated.Text
              entering={enter(160)}
              className="text-muted text-[11px] text-center mt-6 leading-4"
            >
              Devam ederek Whenly'nin koşullarını ve gizlilik politikasını kabul edersin.
            </Animated.Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

/** Birincil eylem — gradyan dolgu + ikon + bası geri bildirimi. */
function PrimaryButton({
  label,
  busy,
  disabled,
  onPress,
}: { label: string; busy: boolean; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, busy }}
      className={`mt-2 rounded-xl overflow-hidden ${disabled ? "opacity-50" : ""}`}
    >
      <LinearGradient
        colors={["#6366F1", "#7C3AED"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          minHeight: 52,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {busy ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text className="text-white font-semibold text-[15px]">{label}</Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}
