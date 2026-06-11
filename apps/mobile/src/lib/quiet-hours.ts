import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Sessiz saatler (ADR-085) — CİHAZDA tutulur (hesap geneli, tek tercih).
 * Bu pencere içinde bildirimler SESSİZ banner'a indirilir (ses/alarm yok),
 * yine de tray'de görünür → kullanıcı uyandırılmaz ama kaçırmaz.
 */
export interface QuietHours {
  enabled: boolean;
  /** 0–23 saat (yerel). start=end ise tüm gün sessiz sayılır. */
  startHour: number;
  endHour: number;
}

export const DEFAULT_QUIET_HOURS: QuietHours = {
  enabled: false,
  startHour: 22,
  endHour: 7,
};

const STORAGE_KEY = "whenly.quietHours";

/**
 * Verilen an sessiz pencerede mi? Gece-aşan aralığı (örn. 22→7) doğru kapsar:
 * start<end → [start,end); start>end → [start,24)∪[0,end); start==end → tüm gün.
 */
export function isInQuietHours(date: Date, qh: QuietHours): boolean {
  if (!qh.enabled) return false;
  const h = date.getHours();
  const { startHour: s, endHour: e } = qh;
  if (s === e) return true;
  if (s < e) return h >= s && h < e;
  return h >= s || h < e;
}

export async function getQuietHours(): Promise<QuietHours> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_QUIET_HOURS;
  try {
    const p = JSON.parse(raw) as Partial<QuietHours>;
    const clampH = (n: unknown, d: number): number =>
      typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 23 ? n : d;
    return {
      enabled: p.enabled === true,
      startHour: clampH(p.startHour, DEFAULT_QUIET_HOURS.startHour),
      endHour: clampH(p.endHour, DEFAULT_QUIET_HOURS.endHour),
    };
  } catch {
    return DEFAULT_QUIET_HOURS;
  }
}

export async function setQuietHours(qh: QuietHours): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(qh));
}

/** Şu an sessiz pencerede miyiz? (bildirim işleyici için kısa yol) */
export async function isQuietNow(now: Date = new Date()): Promise<boolean> {
  return isInQuietHours(now, await getQuietHours());
}
