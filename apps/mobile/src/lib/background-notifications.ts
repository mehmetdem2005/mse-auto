import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { handleIncomingData } from "./notifications";

/** Arka-plan bildirim task adı. */
export const BG_NOTIFICATION_TASK = "watcher-bg-notification";

// Modül yüklenince tanımlanmalı (React bileşeni dışında, headless çalıştırmada da yüklenir).
// Uygulama arka planda/kapalıyken gelen DATA-ONLY push'u işler: payload, data.dataString
// içinde JSON string olarak gelir → handleIncomingData (gate + alarm-config + entitlements
// backstop) ile aynı sunum mantığı uygulanır.
TaskManager.defineTask<Notifications.NotificationTaskPayload>(
  BG_NOTIFICATION_TASK,
  async ({ data, error }) => {
    if (error || !data || !("data" in data)) return;
    const dataString = data.data.dataString;
    if (typeof dataString !== "string") return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(dataString);
    } catch {
      return; // bozuk payload — sessizce yut
    }
    if (typeof parsed !== "object" || parsed === null) return;
    await handleIncomingData(parsed as Record<string, string | undefined>);
  },
);

/**
 * Arka-plan bildirim task'ını kaydeder (uygulama açılışında çağrılır).
 * Expo Go / desteklenmeyen ortamda sessizce atlar.
 */
export async function registerBackgroundNotifications(): Promise<void> {
  try {
    await Notifications.registerTaskAsync(BG_NOTIFICATION_TASK);
  } catch {
    // development build dışında çalışmaz; yut
  }
}
