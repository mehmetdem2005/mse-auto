import {
  PLAN_ENTITLEMENTS,
  type Plan,
  type PlanEntitlements,
  type PlanLimits,
} from "../domain/plan";
import type { SettingsRepository } from "../domain/settings";

/**
 * Admin-yapılandırılır plan yetkileri (ADR-160). `domain/plan.ts` PLAN_ENTITLEMENTS artık VARSAYILAN;
 * admin `app_settings['plan.entitlements']`'te override yazabilir (migration YOK). Use-case'ler
 * `settings` verildiğinde buradan okur, yoksa statik varsayılana düşer (geri-uyumlu → mevcut testler
 * etkilenmez). Değerler clamp'lenir (maxActiveWatches/minFrequencyMinutes ≥1) — bozuk admin girdisi
 * sistemi düşürmesin. Plan-features (ADR-139) deseninin entitlement karşılığı.
 */
const KEY = "plan.entitlements";

type StoredPlan = Partial<PlanEntitlements>;
type Stored = Partial<Record<Plan, StoredPlan>>;

function clampInt(v: unknown, min: number, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) && v >= min ? Math.floor(v) : fallback;
}
function asBool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

/** Saklanan (kısmi/bozuk olabilir) değeri varsayılan üstüne güvenle birleştir. */
function merge(def: PlanEntitlements, stored: StoredPlan | undefined): PlanEntitlements {
  if (!stored) return def;
  return {
    maxActiveWatches: clampInt(stored.maxActiveWatches, 1, def.maxActiveWatches),
    minFrequencyMinutes: clampInt(stored.minFrequencyMinutes, 1, def.minFrequencyMinutes),
    alarmChannel: asBool(stored.alarmChannel, def.alarmChannel),
    allSounds: asBool(stored.allSounds, def.allSounds),
  };
}

function readStored(v: unknown): Stored {
  if (!v || typeof v !== "object") return {};
  const o = v as Record<string, unknown>;
  const out: Stored = {};
  for (const p of ["free", "pro"] as const) {
    const pv = o[p];
    if (pv && typeof pv === "object") out[p] = pv as StoredPlan;
  }
  return out;
}

/** Tüm planların ETKİN yetkileri (admin override defaults üstüne birleştirilmiş). */
export async function getPlanEntitlements(
  settings: SettingsRepository,
): Promise<Record<Plan, PlanEntitlements>> {
  const stored = readStored(await settings.get(KEY));
  return {
    free: merge(PLAN_ENTITLEMENTS.free, stored.free),
    pro: merge(PLAN_ENTITLEMENTS.pro, stored.pro),
  };
}

export async function getEntitlements(
  settings: SettingsRepository,
  plan: Plan,
): Promise<PlanEntitlements> {
  return (await getPlanEntitlements(settings))[plan];
}

/** Maliyet-getiren limitler (sunucu-zorunlu) — etkin yetkilerden türetilir. */
export async function getLimits(settings: SettingsRepository, plan: Plan): Promise<PlanLimits> {
  const e = await getEntitlements(settings, plan);
  return { maxActiveWatches: e.maxActiveWatches, minFrequencyMinutes: e.minFrequencyMinutes };
}

/** Admin: bir planın yetkilerini ayarla (clamp'li) → güncel TAM tabloyu döndür. */
export async function setPlanEntitlements(
  settings: SettingsRepository,
  plan: Plan,
  value: PlanEntitlements,
): Promise<Record<Plan, PlanEntitlements>> {
  const stored = readStored(await settings.get(KEY));
  const next: Stored = { ...stored, [plan]: merge(PLAN_ENTITLEMENTS[plan], value) };
  await settings.set(KEY, next);
  return {
    free: merge(PLAN_ENTITLEMENTS.free, next.free),
    pro: merge(PLAN_ENTITLEMENTS.pro, next.pro),
  };
}
