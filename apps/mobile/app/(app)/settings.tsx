import { toast } from "@/components/feedback";
import { BottomSheet } from "@/components/sheet";
import { Btn } from "@/components/ui";
import { GradientHero, HeroOverlap } from "@/components/ui";
import { type LangCode, SUPPORTED_LANGS, setLanguage } from "@/i18n";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/stores/auth";
import { useTheme, useThemeStore } from "@/theme";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import {
  Check,
  ChevronRight,
  FileDown,
  Globe2,
  LifeBuoy,
  MonitorSmartphone,
  Moon,
  Radio,
  ScrollText,
  ShieldCheck,
  Sun,
} from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Platform, Pressable, ScrollView, Share, Text, View } from "react-native";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const theme = useTheme();
  const setMode = useThemeStore((st) => st.setMode);
  const router = useRouter();
  const session = useAuth((s) => s.session);
  const setSession = useAuth((s) => s.setSession);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function enableNotifications() {
    setBusy(true);
    setStatus(null);
    try {
      if (!Device.isDevice) {
        setStatus(t("settings.notifsDevice"));
        return;
      }
      const perm = await Notifications.requestPermissionsAsync();
      if (perm.status !== "granted") {
        setStatus(t("settings.notifsDenied"));
        return;
      }
      const pushToken = await Notifications.getDevicePushTokenAsync(); // Android: FCM
      const platform = Platform.OS === "ios" ? "ios" : "android";
      await api.registerDevice(String(pushToken.data), platform);
      setStatus(t("settings.notifsOk"));
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "kaydedilemedi");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
  }

  async function confirmDelete() {
    setBusy(true);
    setStatus(null);
    try {
      await api.deleteAccount();
      if (supabase) await supabase.auth.signOut();
      setSession(null);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : t("settings.deleteFail"));
    } finally {
      setBusy(false);
    }
  }

  // Veri dökümü (KVKK m.11 / GDPR Art.20): JSON'u web'de dosya olarak indir,
  // native'de sistem paylaşım sayfasıyla dışarı aktar (ek bağımlılık yok).
  async function exportData() {
    setBusy(true);
    try {
      const data = await api.exportAccount();
      const json = JSON.stringify(data, null, 2);
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = "whenly-export.json";
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({ message: json });
      }
      toast.success(t("legal.exportOk"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("legal.exportFail"));
    } finally {
      setBusy(false);
    }
  }

  function deleteAccount() {
    Alert.alert(t("settings.deleteTitle"), t("settings.deleteMsg"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("settings.deleteTitle"),
        style: "destructive",
        onPress: () => void confirmDelete(),
      },
    ]);
  }

  return (
    <View className="flex-1 bg-ink">
      <GradientHero title={t("tabs.settings")} subtitle={t("settings.account")} />
      <HeroOverlap>
        <ScrollView className="flex-1 px-5" contentContainerClassName="pt-5 pb-10">
          <View className="bg-panel border border-line rounded-2xl p-5 mb-4">
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-full bg-accent items-center justify-center">
                <Text className="text-white text-lg font-bold">
                  {(session?.email ?? session?.userId ?? "?").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-text text-sm font-semibold" numberOfLines={1}>
                  {session?.email ?? session?.userId ?? "—"}
                </Text>
                <Text className="text-muted text-xs mt-0.5">{t("settings.account")}</Text>
              </View>
            </View>
          </View>

          {/* Dil seçici (ADR-053) — 11 dil, kalıcı tercih */}
          <Pressable
            onPress={() => setLangOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t("settings.languageA11y")}
            className="bg-panel border border-line rounded-xl p-5 mb-4 active:bg-panel2"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-accent/10 items-center justify-center">
                <Globe2 size={18} color="#6366F1" />
              </View>
              <View className="flex-1">
                <Text className="text-text text-sm font-semibold">{t("settings.language")}</Text>
                <Text className="text-muted text-xs mt-0.5">
                  {SUPPORTED_LANGS.find((l) => l.code === i18n.language)?.native ?? i18n.language}
                </Text>
              </View>
              <ChevronRight size={16} color={theme.colors.mutedIcon} />
            </View>
          </Pressable>
          <BottomSheet visible={langOpen} onClose={() => setLangOpen(false)}>
            <View>
              {SUPPORTED_LANGS.map((l) => {
                const sel = i18n.language === l.code;
                return (
                  <Pressable
                    key={l.code}
                    onPress={() => {
                      void setLanguage(l.code as LangCode);
                      setLangOpen(false);
                    }}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: sel }}
                    accessibilityLabel={l.native}
                    className="flex-row items-center justify-between px-5 min-h-[52px] border-b border-line active:bg-panel2"
                  >
                    <Text className={`text-[15px] ${sel ? "text-accent font-bold" : "text-text"}`}>
                      {l.native}
                    </Text>
                    {sel ? <Check size={17} color="#6366F1" /> : null}
                  </Pressable>
                );
              })}
            </View>
          </BottomSheet>

          {/* Görünüm seçici (ADR-063) — Sistem/Açık/Koyu, kalıcı */}
          <Pressable
            onPress={() => setThemeOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t("settings.appearanceA11y")}
            className="bg-panel border border-line rounded-xl p-5 mb-4 active:bg-panel2"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-accent/10 items-center justify-center">
                {theme.dark ? (
                  <Moon size={18} color={theme.colors.accent} />
                ) : (
                  <Sun size={18} color={theme.colors.accent} />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-text text-sm font-semibold">{t("settings.appearance")}</Text>
                <Text className="text-muted text-xs mt-0.5">
                  {t(
                    theme.mode === "system"
                      ? "settings.themeSystem"
                      : theme.mode === "dark"
                        ? "settings.themeDark"
                        : "settings.themeLight",
                  )}
                </Text>
              </View>
              <ChevronRight size={16} color={theme.colors.mutedIcon} />
            </View>
          </Pressable>
          <BottomSheet visible={themeOpen} onClose={() => setThemeOpen(false)}>
            <View>
              {(
                [
                  ["system", "settings.themeSystem", MonitorSmartphone],
                  ["light", "settings.themeLight", Sun],
                  ["dark", "settings.themeDark", Moon],
                ] as const
              ).map(([m, key, Icon]) => {
                const sel = theme.mode === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => {
                      setMode(m);
                      setThemeOpen(false);
                    }}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: sel }}
                    accessibilityLabel={t(key)}
                    className="flex-row items-center gap-3 px-5 min-h-[52px] border-b border-line active:bg-panel2"
                  >
                    <Icon size={18} color={sel ? theme.colors.accent : theme.colors.mutedIcon} />
                    <Text
                      className={`text-[15px] flex-1 ${sel ? "text-accent font-bold" : "text-text"}`}
                    >
                      {t(key)}
                    </Text>
                    {sel ? <Check size={17} color={theme.colors.accent} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </BottomSheet>

          <Pressable
            onPress={() => router.push("/support")}
            accessibilityRole="button"
            accessibilityLabel={t("settings.supportA11y")}
            className="bg-panel border border-line rounded-xl p-5 mb-4 active:bg-panel2"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-accent/10 items-center justify-center">
                <LifeBuoy size={18} color="#6366F1" />
              </View>
              <View className="flex-1">
                <Text className="text-text text-sm font-semibold">
                  {t("settings.supportTitle")}
                </Text>
                <Text className="text-muted text-xs mt-0.5">{t("settings.supportSub")}</Text>
              </View>
              <ChevronRight size={16} color={theme.colors.mutedIcon} />
            </View>
          </Pressable>

          <View className="bg-panel border border-line rounded-xl p-5 mb-4">
            <Text className="text-muted text-[10px] tracking-widest uppercase mb-2">
              {t("settings.notifs")}
            </Text>
            <Text className="text-muted text-xs mb-3">{t("settings.notifsHint")}</Text>
            <Btn onPress={enableNotifications} disabled={busy}>
              <Text className="text-white text-xs font-semibold uppercase tracking-wider">
                {t("settings.notifsBtn")}
              </Text>
            </Btn>
            {status ? <Text className="text-muted text-xs mt-3">{status}</Text> : null}
          </View>

          {/* Ek bildirim kanalları (ADR-084): Telegram / E-posta / WhatsApp */}
          <Pressable
            onPress={() => router.push("/channels")}
            accessibilityRole="button"
            accessibilityLabel={t("channels.title")}
            className="bg-panel border border-line rounded-xl p-5 mb-4 active:bg-panel2"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-accent/10 items-center justify-center">
                <Radio size={18} color="#6366F1" />
              </View>
              <View className="flex-1">
                <Text className="text-text text-sm font-semibold">{t("channels.title")}</Text>
                <Text className="text-muted text-xs mt-0.5">{t("channels.sub")}</Text>
              </View>
              <ChevronRight size={16} color={theme.colors.mutedIcon} />
            </View>
          </Pressable>

          {/* Yasal katman (ADR-079): gizlilik politikası + koşullar + veri dökümü */}
          <Pressable
            onPress={() => router.push("/legal/privacy")}
            accessibilityRole="button"
            accessibilityLabel={t("legal.privacyTitle")}
            className="bg-panel border border-line rounded-xl p-5 mb-4 active:bg-panel2"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-pos/10 items-center justify-center">
                <ShieldCheck size={18} color="#16A34A" />
              </View>
              <View className="flex-1">
                <Text className="text-text text-sm font-semibold">{t("settings.privacy")}</Text>
                <Text className="text-muted text-xs mt-0.5">{t("settings.privacySub")}</Text>
              </View>
              <ChevronRight size={16} color={theme.colors.mutedIcon} />
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push("/legal/terms")}
            accessibilityRole="button"
            accessibilityLabel={t("legal.termsTitle")}
            className="bg-panel border border-line rounded-xl p-5 mb-4 active:bg-panel2"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-accent/10 items-center justify-center">
                <ScrollText size={18} color="#6366F1" />
              </View>
              <View className="flex-1">
                <Text className="text-text text-sm font-semibold">{t("legal.termsTitle")}</Text>
                <Text className="text-muted text-xs mt-0.5">{t("legal.termsSub")}</Text>
              </View>
              <ChevronRight size={16} color={theme.colors.mutedIcon} />
            </View>
          </Pressable>

          <Pressable
            onPress={() => void exportData()}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={t("legal.exportTitle")}
            className="bg-panel border border-line rounded-xl p-5 mb-4 active:bg-panel2"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-accent/10 items-center justify-center">
                <FileDown size={18} color="#6366F1" />
              </View>
              <View className="flex-1">
                <Text className="text-text text-sm font-semibold">{t("legal.exportTitle")}</Text>
                <Text className="text-muted text-xs mt-0.5">{t("legal.exportSub")}</Text>
              </View>
              <ChevronRight size={16} color={theme.colors.mutedIcon} />
            </View>
          </Pressable>

          <View className="bg-panel border border-line rounded-xl p-5 mb-4">
            <Text className="text-muted text-[10px] tracking-widest uppercase mb-2">
              {t("settings.danger")}
            </Text>
            <Text className="text-muted text-xs mb-3">{t("settings.dangerHint")}</Text>
            <Btn tone="ghost" onPress={deleteAccount} disabled={busy}>
              <Text className="text-red-400 text-xs uppercase tracking-wider">
                {t("settings.deleteBtn")}
              </Text>
            </Btn>
          </View>

          <Btn tone="ghost" onPress={signOut}>
            <Text className="text-text text-[13px] font-semibold">{t("settings.signOut")}</Text>
          </Btn>
          <Text className="text-muted text-[10px] text-center mt-6 mb-8">
            {t("settings.footer")}
          </Text>
        </ScrollView>
      </HeroOverlap>
    </View>
  );
}
