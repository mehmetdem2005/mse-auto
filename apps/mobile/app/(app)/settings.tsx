import { Btn } from "@/components/ui";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/stores/auth";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { ChevronRight, LifeBuoy } from "lucide-react-native";
import { useState } from "react";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";

export default function Settings() {
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
        setStatus("Bildirimler gerçek cihazda çalışır (emülatör değil).");
        return;
      }
      const perm = await Notifications.requestPermissionsAsync();
      if (perm.status !== "granted") {
        setStatus("Bildirim izni verilmedi.");
        return;
      }
      const pushToken = await Notifications.getDevicePushTokenAsync(); // Android: FCM
      const platform = Platform.OS === "ios" ? "ios" : "android";
      await api.registerDevice(String(pushToken.data), platform);
      setStatus("Cihaz kaydedildi — bildirimler aktif.");
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
      setStatus(e instanceof Error ? e.message : "silinemedi");
    } finally {
      setBusy(false);
    }
  }

  function deleteAccount() {
    Alert.alert(
      "Hesabı sil",
      "Tüm watcher'ların, cihazların ve aboneliğin kalıcı olarak silinecek. Bu geri alınamaz.",
      [
        { text: "Vazgeç", style: "cancel" },
        { text: "Hesabı sil", style: "destructive", onPress: () => void confirmDelete() },
      ],
    );
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
            <Text className="text-muted text-xs mt-0.5">Whenly hesabın</Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={() => router.push("/support")}
        accessibilityRole="button"
        accessibilityLabel="Destek ve iletişim sayfasını aç"
        className="bg-panel border border-line rounded-xl p-5 mb-4 active:bg-panel2"
      >
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-accent/10 items-center justify-center">
            <LifeBuoy size={18} color="#6366F1" />
          </View>
          <View className="flex-1">
            <Text className="text-text text-sm font-semibold">Destek & İletişim</Text>
            <Text className="text-muted text-xs mt-0.5">Sorun bildir · canlı destek · e-posta</Text>
          </View>
          <ChevronRight size={16} color="#475569" />
        </View>
      </Pressable>

      <View className="bg-panel border border-line rounded-xl p-5 mb-4">
        <Text className="text-muted text-[10px] tracking-widest uppercase mb-2">bildirimler</Text>
        <Text className="text-muted text-xs mb-3">
          İzin ver ve bu cihazı push için kaydet (FCM).
        </Text>
        <Btn onPress={enableNotifications} disabled={busy}>
          <Text className="text-white text-xs font-semibold uppercase tracking-wider">
            bildirimleri etkinleştir
          </Text>
        </Btn>
        {status ? <Text className="text-muted text-xs mt-3">{status}</Text> : null}
      </View>

      <View className="bg-panel border border-line rounded-xl p-5 mb-4">
        <Text className="text-muted text-[10px] tracking-widest uppercase mb-2">
          tehlikeli bölge
        </Text>
        <Text className="text-muted text-xs mb-3">
          Hesabını ve tüm verini kalıcı olarak sil (KVKK/GDPR). Geri alınamaz.
        </Text>
        <Btn tone="ghost" onPress={deleteAccount} disabled={busy}>
          <Text className="text-red-400 text-xs uppercase tracking-wider">hesabı sil</Text>
        </Btn>
      </View>

      <Btn tone="ghost" onPress={signOut}>
        <Text className="text-text text-[13px] font-semibold">Çıkış yap</Text>
      </Btn>
      <Text className="text-muted text-[10px] text-center mt-6 mb-8">
        Whenly · hesabındaki gizlilik ve veri hakların için Destek &amp; İletişim
      </Text>
    </ScrollView>
  );
}
