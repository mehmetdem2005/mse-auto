import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Platform } from "react-native";
import { getAlarmConfig } from "./alarm-config";
import { ALARM_SOUNDS } from "./alarm-sounds";
import { api } from "./api";
import { getCachedEntitlements } from "./entitlements-cache";
import { isQuietNow } from "./quiet-hours";

const DEFAULT_CHANNEL = "default";
const MUTED_CHANNEL = "muted"; // sessiz saatler: düşük öncelik, ses yok

/** ADR-092 — kişisel arketipte cihaz "sonuç" dedi: tercih açıksa izlemeyi durdur. */
async function pauseIfStopAfterHit(watchId: string): Promise<void> {
  try {
    const watches = await api.watchers();
    const w = watches.find((x) => x.id === watchId);
    if (w && w.status === "active" && (w.stopAfterHit ?? true)) {
      await api.setMyWatchStatus(watchId, "paused");
    }
  } catch {
    // Telemetri-dışı yan etki: başarısızlık bildirimi engellemez; sonraki tespitte yinelenir.
  }
}

function soundFile(soundId: string): string | null {
  return ALARM_SOUNDS.find((s) => s.id === soundId)?.file ?? null;
}

export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    // Sessiz saatlerde ses çalma (ön planda) — banner/list yine görünür.
    handleNotification: async () => {
      const quiet = await isQuietNow();
      return {
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: !quiet,
        shouldSetBadge: false,
      };
    },
  });
  if (Platform.OS === "android") {
    void Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL, {
      name: "Bildirimler",
      importance: Notifications.AndroidImportance.HIGH,
    });
    // Sessiz saatler kanalı: düşük öncelik + ses yok (tray'de görünür, uyandırmaz).
    void Notifications.setNotificationChannelAsync(MUTED_CHANNEL, {
      name: "Sessiz saatler",
      importance: Notifications.AndroidImportance.LOW,
      sound: null,
      enableVibrate: false,
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
  // ADR-092: kişisel arketip teslimi (gate=1) cihaza ulaştı → sonuç-bulununca-durdur
  // tercihi açıksa izleme sunucuda duraklatılır (sunucu kişisel bağlamı bilmez, P1).
  // Hata kritik değil, sessiz geçilir. (Cihaz-içi "kişisel filtre" ADR-094'te kaldırıldı.)
  if (data.gate === "1" && data.watchId) void pauseIfStopAfterHit(data.watchId);
  const watchId = data.watchId;
  const cfg = watchId ? await getAlarmConfig(watchId) : null;
  let channel = cfg?.channel ?? "notify";
  // Teslim-zamanı yetki kontrolü (downgrade backstop): alarm yetkisi düşmüşse bildirime indir.
  if (channel === "alarm") {
    const ent = await getCachedEntitlements();
    if (ent && !ent.alarmChannel) channel = "notify";
  }
  if (channel === "silent") return;

  // Sessiz saatler (ADR-085): pencere içinde ses/alarm yok → sessiz banner'a indir
  // (tray'de görünür, uyandırmaz). Kullanıcı silent seçmediyse bilgi yine ulaşır.
  const quiet = await isQuietNow();
  if (quiet) channel = "notify";

  const content = {
    title: data.title ?? "Watcher",
    body: data.body ?? "İzlediğin olay gerçekleşti.",
    data,
  };

  if (channel === "alarm" && cfg && !quiet) {
    // ADR-162: ön planda TAM EKRAN çalan-alarm ekranını aç — ses DÖNGÜYLE orada çalar, bu yüzden
    // ayrıca gürültülü bildirim PLANLAMAYIZ (çift ses olmaz). Kilit/arka planda OS'nin alarm kanalı
    // (ensureAlarmChannel; MAX importance, bypassDnd) çalar; bildirime dokununca response-listener
    // yine bu ekrana getirir. ensureAlarmChannel kanalı, arka-plan native bildirim için hazır kalır.
    await ensureAlarmChannel(cfg.soundId);
    openAlarmScreen(data);
    return;
  }
  await Notifications.scheduleNotificationAsync({
    content: quiet ? { ...content, sound: false } : content,
    trigger: { channelId: quiet ? MUTED_CHANNEL : DEFAULT_CHANNEL },
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

/** Tam ekran çalan-alarm ekranına git (ön plan + bildirime-dokunma ortak yolu; ADR-162). */
function openAlarmScreen(data: Record<string, string | undefined>): void {
  try {
    router.push({
      pathname: "/alarm",
      params: {
        watchId: data.watchId ?? "",
        title: data.title ?? "Watcher",
        body: data.body ?? "",
      },
    });
  } catch {
    // Router henüz hazır değilse (nadir) sessiz geç — bildirim yine de görünür.
  }
}

/**
 * Bildirime DOKUNMA (arka plan→ön plan): alarm tercihli watcher'sa tam ekran alarm ekranını açar.
 * registerForegroundListener alarmı ön planda zaten yakalar; bu, kilitliyken gelen OS bildirimine
 * dokunulduğunda devreye girer (ADR-162). Alarm değilse hiçbir şey yapmaz (normal akış sürer).
 */
export function registerResponseListener(): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
    const data = (resp.notification.request.content.data ?? {}) as Record<
      string,
      string | undefined
    >;
    void (async () => {
      if (data.alarm === "1") {
        openAlarmScreen(data);
        return;
      }
      const watchId = data.watchId;
      if (!watchId) return;
      const cfg = await getAlarmConfig(watchId);
      if (cfg.channel !== "alarm") return;
      // Teslim-zamanı yetki backstop'u (handleIncomingData ile tutarlı): alarm yetkisi düştüyse açma.
      const ent = await getCachedEntitlements();
      if (ent && !ent.alarmChannel) return;
      openAlarmScreen(data);
    })();
  });
  return () => sub.remove();
}
