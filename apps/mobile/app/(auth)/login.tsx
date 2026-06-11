import { Field, PrimaryButton } from "@/components/ui";
import { useReduceMotion } from "@/lib/reduce-motion";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/stores/auth";
import { useTheme } from "@/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
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
                {t("login.tagline")}
              </Text>
            </View>
          </View>
          <Text className="text-white text-[26px] font-extrabold leading-8 mt-7">
            {t("login.hero")}
          </Text>
          <Text className="text-white/80 text-[13px] mt-2 leading-5">{t("login.heroSub")}</Text>
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
              <Text className="text-text text-xl font-bold">{t("login.title")}</Text>
              <Text className="text-muted text-[13px] mt-1 mb-5">
                {supabaseConfigured ? t("login.subtitle") : t("login.devSubtitle")}
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
                  <Field label={t("login.email")}>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      autoComplete="email"
                      keyboardType="email-address"
                      placeholder="ornek@whenly.app"
                      placeholderTextColor={theme.colors.placeholder}
                      className="bg-ink border border-line rounded-xl px-4 py-3.5 text-text text-[15px]"
                    />
                  </Field>
                  <Field label={t("login.password")}>
                    <View className="flex-row items-center bg-ink border border-line rounded-xl pr-2">
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPass}
                        autoComplete="password"
                        placeholder="••••••••"
                        placeholderTextColor={theme.colors.placeholder}
                        accessibilityLabel={t("login.password")}
                        className="flex-1 px-4 py-3.5 text-text text-[15px]"
                      />
                      <Pressable
                        onPress={() => setShowPass((v) => !v)}
                        accessibilityRole="button"
                        accessibilityLabel={showPass ? t("login.hidePass") : t("login.showPass")}
                        className="w-11 h-11 items-center justify-center"
                      >
                        {showPass ? (
                          <EyeOff size={18} color={theme.colors.mutedIcon} />
                        ) : (
                          <Eye size={18} color={theme.colors.mutedIcon} />
                        )}
                      </Pressable>
                    </View>
                  </Field>
                  <PrimaryButton
                    label={t("login.signIn")}
                    busy={busy}
                    disabled={busy || !email || !password}
                    onPress={signIn}
                  />
                </>
              ) : (
                <>
                  <Field label={t("login.devId")}>
                    <TextInput
                      value={devId}
                      onChangeText={setDevId}
                      autoCapitalize="none"
                      placeholder="admin_demo"
                      placeholderTextColor={theme.colors.placeholder}
                      className="bg-ink border border-line rounded-xl px-4 py-3.5 text-text text-[15px]"
                    />
                  </Field>
                  <PrimaryButton
                    label={t("login.signIn")}
                    busy={false}
                    disabled={!devId}
                    onPress={() =>
                      setSession({ token: devId.trim(), email: null, userId: devId.trim() })
                    }
                  />
                  <Text className="text-muted text-[11px] mt-4 text-center">
                    {t("login.devNote")}
                  </Text>
                </>
              )}
            </Animated.View>

            {/* Yasal bağlantılar (ADR-079): belgeler giriş öncesi okunabilir */}
            <Animated.View entering={enter(160)} className="mt-6">
              <Text className="text-muted text-[11px] text-center leading-4">
                {t("login.terms")}
              </Text>
              <View className="flex-row justify-center gap-5 mt-2">
                <Pressable
                  onPress={() => router.push("/legal/terms")}
                  accessibilityRole="link"
                  accessibilityLabel={t("legal.termsTitle")}
                  className="min-h-[44px] justify-center"
                >
                  <Text className="text-accent text-[11px] font-semibold underline">
                    {t("legal.termsTitle")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push("/legal/privacy")}
                  accessibilityRole="link"
                  accessibilityLabel={t("legal.privacyTitle")}
                  className="min-h-[44px] justify-center"
                >
                  <Text className="text-accent text-[11px] font-semibold underline">
                    {t("legal.privacyTitle")}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
