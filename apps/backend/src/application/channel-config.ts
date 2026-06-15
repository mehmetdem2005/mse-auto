import type { ChannelKind } from "../domain/channels";
import type { SettingsRepository } from "../domain/settings";

/** Admin'in açıp kapattığı ek kanal desteği (ADR-107). FCM push her zaman açık. */
export interface ChannelAvailability {
  telegram: boolean;
  whatsapp: boolean;
  email: boolean;
}

const KEY = "channels.availability";

/** Varsayılan: hepsi AÇIK (geriye dönük güvenli — ayar yoksa kanal çalışmaya devam eder). */
export const DEFAULT_CHANNEL_AVAILABILITY: ChannelAvailability = {
  telegram: true,
  whatsapp: true,
  email: true,
};

export async function getChannelAvailability(
  settings: SettingsRepository,
): Promise<ChannelAvailability> {
  const v = await settings.get(KEY);
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    // Yalnız açıkça false ise kapalı; eksik anahtar = açık (geriye dönük güvenli).
    return {
      telegram: o.telegram !== false,
      whatsapp: o.whatsapp !== false,
      email: o.email !== false,
    };
  }
  return DEFAULT_CHANNEL_AVAILABILITY;
}

/** @returns kalıcı mı (app_settings tablosu varsa true). */
export async function setChannelAvailability(
  settings: SettingsRepository,
  value: ChannelAvailability,
): Promise<boolean> {
  return settings.set(KEY, value);
}

/** Admin'in açık bıraktığı kanal kümesi — teslimde filtre olarak uygulanır. */
export function enabledKinds(av: ChannelAvailability): Set<ChannelKind> {
  const s = new Set<ChannelKind>();
  if (av.telegram) s.add("telegram");
  if (av.whatsapp) s.add("whatsapp");
  if (av.email) s.add("email");
  return s;
}

/**
 * Sunucunun GERÇEKTEN gönderebildiği kanallar (ADR-152) — `buildChannels(env)` çıktısının
 * kind kümesinden türetilir (kimlik bilgisi = sender üretilmiş demek). Admin bir kanalı açsa bile
 * sunucuda anahtar yoksa teslim edilemez; bunu UI'da "henüz hazır değil" olarak dürüstçe göster.
 */
export function configuredAvailability(kinds: Iterable<ChannelKind>): ChannelAvailability {
  const s = new Set(kinds);
  return { telegram: s.has("telegram"), whatsapp: s.has("whatsapp"), email: s.has("email") };
}

/** Etkin kullanılabilirlik (ADR-152) = admin AÇTI **ve** sunucuda kimlik bilgisi var. */
export function effectiveAvailability(
  admin: ChannelAvailability,
  configured: ChannelAvailability,
): ChannelAvailability {
  return {
    telegram: admin.telegram && configured.telegram,
    whatsapp: admin.whatsapp && configured.whatsapp,
    email: admin.email && configured.email,
  };
}
