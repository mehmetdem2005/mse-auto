import type { Plan, PlanFeatures, SetPlanFeaturesInput } from "@watcher/contracts";
import type { SettingsRepository } from "../domain/settings";

const KEY = "plan.features";

/**
 * Plan özellik-maddeleri (ADR-139) — admin-yazılabilir, DİLE-ÖZEL madde listeleri; app_settings'te
 * JSON olarak saklanır (migration YOK). Şekil: `{ free: { <lang>: string[] }, pro: { <lang>: string[] } }`.
 * Admin bir dil için madde yazmadıysa o dilde BOŞ döner → istemci yerelleştirilmiş i18n varsayılanını
 * gösterir (dürüst: backend dil-bağımsız; çeviri yükü istemcide tek-kaynak i18n kataloğunda).
 */

type Stored = Partial<Record<Plan, Record<string, string[]>>>;

function readStored(v: unknown): Stored {
  if (!v || typeof v !== "object") return {};
  const o = v as Record<string, unknown>;
  const out: Stored = {};
  for (const plan of ["free", "pro"] as const) {
    const byLang = o[plan];
    if (byLang && typeof byLang === "object") {
      const acc: Record<string, string[]> = {};
      for (const [lang, bullets] of Object.entries(byLang as Record<string, unknown>)) {
        if (Array.isArray(bullets)) {
          acc[lang] = bullets.filter((b): b is string => typeof b === "string");
        }
      }
      out[plan] = acc;
    }
  }
  return out;
}

/** Bir dil için admin-yazılı maddeler (yoksa boş dizi → istemci i18n varsayılanına düşer). */
export async function getPlanFeatures(
  settings: SettingsRepository,
  lang: string,
): Promise<PlanFeatures> {
  const stored = readStored(await settings.get(KEY));
  return {
    free: stored.free?.[lang] ?? [],
    pro: stored.pro?.[lang] ?? [],
  };
}

/** Admin: tek plan + tek dilin maddelerini ayarla; o dildeki güncel {free, pro}'yu döndürür. */
export async function setPlanFeatures(
  settings: SettingsRepository,
  input: SetPlanFeaturesInput,
): Promise<PlanFeatures> {
  const stored = readStored(await settings.get(KEY));
  const byLang = { ...(stored[input.plan] ?? {}) };
  byLang[input.lang] = input.bullets;
  const next: Stored = { ...stored, [input.plan]: byLang };
  await settings.set(KEY, next);
  return {
    free: next.free?.[input.lang] ?? [],
    pro: next.pro?.[input.lang] ?? [],
  };
}
