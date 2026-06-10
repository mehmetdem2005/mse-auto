import { Btn } from "@/components/ui";
import { type LangCode, SUPPORTED_LANGS, setLanguage } from "@/i18n";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/stores/auth";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { Check, ChevronRight, Globe2, LifeBuoy, ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
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
    <ScrollView className="flex-1 bg-ink px-5 pt-4">
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
          <ChevronRight size={16} color="#475569" />
        </View>
      </Pressable>
      <Modal
        transparent
        visible={langOpen}
        animationType="fade"
        onRequestClose={() => setLangOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/30 justify-center px-10"
          onPress={() => setLangOpen(false)}
          accessibilityLabel={t("common.close")}
        >
          <View className="bg-panel rounded-2xl overflow-hidden max-h-[70%]">
            <ScrollView>
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
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

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
            <Text className="text-text text-sm font-semibold">{t("settings.supportTitle")}</Text>
            <Text className="text-muted text-xs mt-0.5">{t("settings.supportSub")}</Text>
          </View>
          <ChevronRight size={16} color="#475569" />
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
          <ChevronRight size={16} color="#475569" />
        </View>
      </Pressable>
      <Modal
        transparent
        visible={langOpen}
        animationType="fade"
        onRequestClose={() => setLangOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/30 justify-center px-10"
          onPress={() => setLangOpen(false)}
          accessibilityLabel={t("common.close")}
        >
          <View className="bg-panel rounded-2xl overflow-hidden max-h-[70%]">
            <ScrollView>
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
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <Pressable
        onPress={() => router.push("/support")}
        accessibilityRole="button"
        accessibilityLabel={t("settings.privacyA11y")}
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
          <ChevronRight size={16} color="#475569" />
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
      <Text className="text-muted text-[10px] text-center mt-6 mb-8">{t("settings.footer")}</Text>
    </ScrollView>
  );
}
