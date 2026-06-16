import { PrimaryButton } from "@/components/ui";
import { getAlarmConfig } from "@/lib/alarm-config";
import { haptic } from "@/lib/haptics";
import { useReduceMotion } from "@/lib/reduce-motion";
import { SOUND_MODULES } from "@/lib/sound-modules";
import { useTheme } from "@/theme";
import { type AudioSource, setAudioModeAsync, useAudioPlayer } from "expo-audio";
import * as Notifications from "expo-notifications";
import { router, useLocalSearchParams } from "expo-router";
import { AlarmClock, BellOff } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, Text, Vibration, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

// Çalan-alarm pulse aralığı (ms) — tehdit/aciliyet hissi için yumuşak nefes.
const PULSE_MS = 900;
const SNOOZE_MIN = 5;
const VIBRATION_PATTERN = [0, 600, 400, 600];

function clockNow(): string {
  return new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/**
 * ADR-162: TAM EKRAN ÇALAN-ALARM ekranı. Alarm tercihli bir watcher tetiklenince (ön planda
 * gelen push veya alarm bildirimine dokunma) buraya gelinir: seçili ses DÖNGÜYLE çalar, telefon
 * titreşir, büyük pulse ikon + olay metni + "Durdur" (birincil) / "Ertele" (ikincil). Ekrandan
 * çıkınca/Durdur'da ses+titreşim kesilir. design-standards (token, 8pt, ≥44pt) + web-design
 * (lucide ikon, emoji yok) + ui-ux (tek net birincil eylem) + motion (reduce-motion'da statik).
 */
export default function AlarmScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const reduce = useReduceMotion();
  const params = useLocalSearchParams<{ watchId?: string; title?: string; body?: string }>();
  const player = useAudioPlayer(null);
  const [now, setNow] = useState(clockNow());
  const stopped = useRef(false);
  const scale = useSharedValue(1);
  const ring = useSharedValue(0.6);

  const title = typeof params.title === "string" && params.title ? params.title : "Watcher";
  const body =
    typeof params.body === "string" && params.body ? params.body : t("alarm.defaultBody");
  const watchId = typeof params.watchId === "string" ? params.watchId : undefined;

  // Sesi döngüyle çal + telefonu titret. Sessiz modda da duyulsun (alarm niyeti).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cfg = watchId ? await getAlarmConfig(watchId) : null;
      const src: AudioSource | null = cfg?.customSoundUri
        ? { uri: cfg.customSoundUri }
        : (SOUND_MODULES[cfg?.soundId ?? ""] ?? SOUND_MODULES["alarm-001"] ?? null);
      try {
        await setAudioModeAsync({ playsInSilentMode: true });
      } catch {
        /* en kötü ihtimalle sessiz modda kısık — kritik değil */
      }
      if (cancelled || stopped.current || !src) return;
      try {
        player.replace(src);
        player.loop = true;
        player.seekTo(0);
        player.play();
      } catch {
        /* ses başlatılamazsa ekran + titreşim yine uyarır */
      }
    })();
    if (Platform.OS !== "web") Vibration.vibrate(VIBRATION_PATTERN, true);
    return () => {
      cancelled = true;
      if (Platform.OS !== "web") Vibration.cancel();
      try {
        player.pause();
      } catch {
        /* yut */
      }
    };
  }, [player, watchId]);

  // Canlı saat (her 15 sn yeter — dakika hassasiyeti).
  useEffect(() => {
    const id = setInterval(() => setNow(clockNow()), 15000);
    return () => clearInterval(id);
  }, []);

  // Pulse — reduce-motion'da statik (motion-design zorunluluğu).
  useEffect(() => {
    if (reduce) return;
    scale.value = withRepeat(
      withTiming(1.12, { duration: PULSE_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    ring.value = withRepeat(
      withTiming(1, { duration: PULSE_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [reduce, scale, ring]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: ring.value }));

  function cleanup(): void {
    stopped.current = true;
    if (Platform.OS !== "web") Vibration.cancel();
    try {
      player.pause();
    } catch {
      /* yut */
    }
  }

  function dismiss(): void {
    cleanup();
    haptic.light();
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  async function snooze(): Promise<void> {
    cleanup();
    haptic.light();
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { watchId: watchId ?? "", title, body, alarm: "1" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: SNOOZE_MIN * 60,
        },
      });
    } catch {
      /* erteleme planlanamazsa sessiz geç — kullanıcı yine de uyarıldı */
    }
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  return (
    <View
      className="flex-1 bg-ink items-center justify-between px-6 pt-24 pb-12"
      accessibilityLabel={t("alarm.a11yScreen")}
    >
      {/* Üst: saat + "alarm" etiketi */}
      <View className="items-center">
        <Text className="text-muted text-sm uppercase tracking-[4px]">{t("alarm.title")}</Text>
        <Text className="text-text text-6xl font-extralight mt-2" accessibilityRole="text">
          {now}
        </Text>
      </View>

      {/* Orta: pulse ikon + olay metni */}
      <View className="items-center">
        <View className="w-44 h-44 items-center justify-center mb-8">
          <Animated.View
            style={[
              ringStyle,
              {
                position: "absolute",
                width: 176,
                height: 176,
                borderRadius: 88,
                backgroundColor: colors.accent,
                opacity: 0.15,
              },
            ]}
          />
          <Animated.View
            style={[
              iconStyle,
              {
                width: 116,
                height: 116,
                borderRadius: 58,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
              },
            ]}
          >
            <AlarmClock size={52} color={colors.onAccent} />
          </Animated.View>
        </View>
        <Text
          className="text-text text-2xl font-bold text-center"
          numberOfLines={3}
          accessibilityRole="header"
        >
          {title}
        </Text>
        <Text className="text-muted text-base text-center mt-3 leading-6" numberOfLines={5}>
          {body}
        </Text>
      </View>

      {/* Alt: birincil Durdur + ikincil Ertele */}
      <View className="w-full gap-3">
        <PrimaryButton label={t("alarm.stop")} onPress={dismiss} />
        <Pressable
          onPress={() => void snooze()}
          accessibilityRole="button"
          accessibilityLabel={t("alarm.snooze")}
          className="flex-row items-center justify-center gap-2 py-3.5 min-h-[44px] rounded-2xl border border-line active:bg-panel"
        >
          <BellOff size={16} color={colors.mutedIcon} />
          <Text className="text-muted font-semibold uppercase tracking-wider text-xs">
            {t("alarm.snooze")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
