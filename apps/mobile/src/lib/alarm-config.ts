import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_ALARM_SOUND_ID } from "./alarm-sounds";

/** Bildirim/alarm tercihi — CİHAZDA tutulur (watch başına). */
export type AlarmChannel = "silent" | "notify" | "alarm";
export interface AlarmConfig {
  channel: AlarmChannel;
  soundId: string;
  /** Cihazdan seçilen özel ses (varsa soundId yerine bu çalınır). Yereldedir, sunucuya gitmez. */
  customSoundUri?: string | null;
  customSoundName?: string | null;
}
export const DEFAULT_ALARM_CONFIG: AlarmConfig = {
  channel: "notify",
  soundId: DEFAULT_ALARM_SOUND_ID,
  customSoundUri: null,
  customSoundName: null,
};

const key = (watchId: string): string => `watcher:alarm:${watchId}`;

export async function setAlarmConfig(watchId: string, cfg: AlarmConfig): Promise<void> {
  await AsyncStorage.setItem(key(watchId), JSON.stringify(cfg));
}

export async function getAlarmConfig(watchId: string): Promise<AlarmConfig> {
  const raw = await AsyncStorage.getItem(key(watchId));
  if (!raw) return DEFAULT_ALARM_CONFIG;
  try {
    const p = JSON.parse(raw) as Partial<AlarmConfig>;
    const channel: AlarmChannel =
      p.channel === "silent" || p.channel === "alarm" ? p.channel : "notify";
    return {
      channel,
      soundId: typeof p.soundId === "string" ? p.soundId : DEFAULT_ALARM_SOUND_ID,
      customSoundUri: typeof p.customSoundUri === "string" ? p.customSoundUri : null,
      customSoundName: typeof p.customSoundName === "string" ? p.customSoundName : null,
    };
  } catch {
    return DEFAULT_ALARM_CONFIG;
  }
}

export async function removeAlarmConfig(watchId: string): Promise<void> {
  await AsyncStorage.removeItem(key(watchId));
}
