export type Plan = "free" | "pro";

export interface PlanLimits {
  maxActiveWatches: number;
  minFrequencyMinutes: number;
}

/**
 * Plan yetkileri (entitlements) — TEK KAYNAK (ADR-017).
 * Maliyet-getiren alanlar (watch sayısı, sıklık) sunucu-zorunludur; sunum/cihaz
 * alanları (alarm/ses/kişisel filtre) cihazda tutulduğu için sunucu göremez →
 * istemci, sunucunun bildirdiği entitlement'a göre gate eder.
 */
export interface PlanEntitlements {
  maxActiveWatches: number;
  minFrequencyMinutes: number;
  alarmChannel: boolean; // "alarm" (yüksek sesli) uyarı biçimi
  allSounds: boolean; // 100 sesin tamamı (false → yalnız varsayılan)
  personalFilters: boolean; // arketip-B cihaz-üstü kriter (geo/numeric/keyword)
}

export const PLAN_ENTITLEMENTS: Record<Plan, PlanEntitlements> = {
  free: {
    maxActiveWatches: 3,
    minFrequencyMinutes: 60,
    alarmChannel: false,
    allSounds: false,
    personalFilters: false,
  },
  pro: {
    maxActiveWatches: 100,
    // ADR-047: zaman-kritik konular için pratik alt sınır = zamanlayıcı turu (1 dk).
    minFrequencyMinutes: 1,
    alarmChannel: true,
    allSounds: true,
    personalFilters: true,
  },
};

export function entitlementsFor(plan: Plan): PlanEntitlements {
  return PLAN_ENTITLEMENTS[plan];
}

/** Maliyet-getiren limitler (sunucu-zorunlu) — entitlements'tan türetilir. */
export function limitsFor(plan: Plan): PlanLimits {
  const e = PLAN_ENTITLEMENTS[plan];
  return { maxActiveWatches: e.maxActiveWatches, minFrequencyMinutes: e.minFrequencyMinutes };
}
