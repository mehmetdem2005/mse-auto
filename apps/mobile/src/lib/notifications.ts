import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getAlarmConfig } from "./alarm-config";
import { ALARM_SOUNDS } from "./alarm-sounds";
import { getCachedEntitlements } from "./entitlements-cache";
import { shouldSurface } from "./notification-gate";

const DEFAULT_CHANNEL = "default";

function soundFile(soundId: string): string | null {
  return ALARM_SOUNDS.find((s) => s.id === soundId)?.file ?? null;
}

export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === "android") {
    void Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL, {
      name: "Bildirimler",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

// Android 8+'da bildirim sesi KANALDAN gelir → her alarm sesi için idempotent,
// yüksek-öncelikli kanal. Ses dosyaları assets/sounds → res/raw (EAS config-plugin).
async function ensureAlarmChannel(soundId: string): Promise<string> {
  const channelId = `alarm-${soundId}`;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(channelId, {
      name: `Alarm · ${soundId}`,
      importance: Notifications.AndroidImportance.MAX,
      sound: soundFile(soundId) ?? null,
      vibrationPattern: [0, 400, 200, 400],
      enableVibrate: true,
      bypassDnd: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
  return channelId;
}

/**
 * Gelen push'u CİHAZDA değerlendirip uygun biçimde gösterir (ADR-016, birleşik data-only model):
 * gate=1 (kişisel) ise önce kriter; sonra watch'ın yerel uyarı tercihine göre sessiz/bildirim/alarm.
 */
export async function handleIncomingData(data: Record<string, string | undefined>): Promise<void> {
  if (data.gate === "1") {
    const { surface } = await shouldSurface(data);
    if (!surface) return;
  }
  const watchId = data.watchId;
  const cfg = watchId ? await getAlarmConfig(watchId) : null;
  let channel = cfg?.channel ?? "notify";
  // Teslim-zamanı yetki kontrolü (downgrade backstop): alarm yetkisi düşmüşse bildirime indir.
  if (channel === "alarm") {
    const ent = await getCachedEntitlements();
    if (ent && !ent.alarmChannel) channel = "notify";
  }
  if (channel === "silent") return;

  const content = {
    title: data.title ?? "Watcher",
    body: data.body ?? "İzlediğin olay gerçekleşti.",
    data,
  };

  if (channel === "alarm" && cfg) {
    const channelId = await ensureAlarmChannel(cfg.soundId);
    await Notifications.scheduleNotificationAsync({
      content: { ...content, sound: soundFile(cfg.soundId) ?? true },
      trigger: { channelId },
    });
    return;
  }
  await Notifications.scheduleNotificationAsync({
    content,
    trigger: { channelId: DEFAULT_CHANNEL },
  });
}

/**
 * Ön planda gelen bildirimleri kapıdan geçirir. Dönüş: temizleme.
 * NOT: arka planda data-only mesajların işlenmesi native FCM arka-plan handler'ı gerektirir (EAS).
 */
export function registerForegroundListener(): () => void {
  const sub = Notifications.addNotificationReceivedListener((event) => {
    const data = (event.request.content.data ?? {}) as Record<string, string | undefined>;
    void handleIncomingData(data);
  });
  return () => sub.remove();
}
