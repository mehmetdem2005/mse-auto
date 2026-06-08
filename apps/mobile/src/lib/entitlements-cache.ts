import AsyncStorage from "@react-native-async-storage/async-storage";

/** Son bilinen entitlement'lar — teslim-zamanı (downgrade) kontrolü için cihazda saklanır. */
export interface CachedEntitlements {
  alarmChannel: boolean;
  allSounds: boolean;
  personalFilters: boolean;
}

const KEY = "watcher:entitlements";

export async function setCachedEntitlements(e: CachedEntitlements): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(e));
}

/** Yoksa null → iyimser davran (kişiyi yeni durumda kilitleme). */
export async function getCachedEntitlements(): Promise<CachedEntitlements | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Partial<CachedEntitlements>;
    return {
      alarmChannel: p.alarmChannel === true,
      allSounds: p.allSounds === true,
      personalFilters: p.personalFilters === true,
    };
  } catch {
    return null;
  }
}
