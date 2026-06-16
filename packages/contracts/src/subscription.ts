import { z } from "zod";

export const planSchema = z.enum(["free", "pro"]);
export type Plan = z.infer<typeof planSchema>;

export const billingIntervalSchema = z.enum(["month", "year"]);
export type BillingInterval = z.infer<typeof billingIntervalSchema>;

export const subscriptionDetailSchema = z.object({
  interval: billingIntervalSchema,
  amountCents: z.number().int(),
  currency: z.string(),
  currentPeriodEnd: z.string(),
  status: z.enum(["active", "canceled"]),
  cancelAtPeriodEnd: z.boolean(),
});
export type SubscriptionDetail = z.infer<typeof subscriptionDetailSchema>;

export const subscriptionSchema = z.object({
  plan: planSchema,
  limits: z.object({
    maxActiveWatches: z.number().int(),
    minFrequencyMinutes: z.number().int(),
  }),
  entitlements: z.object({
    maxActiveWatches: z.number().int(),
    minFrequencyMinutes: z.number().int(),
    alarmChannel: z.boolean(),
    allSounds: z.boolean(),
  }),
  usage: z.object({ activeWatches: z.number().int() }),
  subscription: subscriptionDetailSchema.nullable(),
});
export type Subscription = z.infer<typeof subscriptionSchema>;

export const subscribeInputSchema = z.object({
  plan: z.literal("pro"),
  interval: billingIntervalSchema,
});
export type SubscribeInput = z.infer<typeof subscribeInputSchema>;

export const priceSchema = z.object({
  plan: planSchema,
  interval: billingIntervalSchema,
  amountCents: z.number().int(),
  currency: z.string(),
});
export type Price = z.infer<typeof priceSchema>;

export const plansSchema = z.object({ prices: z.array(priceSchema) });
export type Plans = z.infer<typeof plansSchema>;

/**
 * Plan özellik-maddeleri (ADR-139) — admin-yazılabilir, dile-özel madde listeleri (app_settings,
 * migration YOK). Boş dizi → istemci yerelleştirilmiş varsayılan maddeleri (i18n) gösterir.
 */
export const planFeaturesSchema = z.object({
  free: z.array(z.string()),
  pro: z.array(z.string()),
});
export type PlanFeatures = z.infer<typeof planFeaturesSchema>;

/** Admin: tek plan + tek dil için madde listesini ayarla (≤12 madde, her biri ≤120 karakter). */
export const setPlanFeaturesInputSchema = z.object({
  plan: planSchema,
  lang: z.string().min(2).max(8),
  bullets: z.array(z.string().trim().min(1).max(120)).max(12),
});
export type SetPlanFeaturesInput = z.infer<typeof setPlanFeaturesInputSchema>;

/**
 * Plan YETKİLERİ (ADR-160) — admin-yapılandırılır limitler. domain PLAN_ENTITLEMENTS varsayılan;
 * admin app_settings'te override yazar (migration YOK). maxActiveWatches/minFrequencyMinutes ≥1 clamp.
 */
export const planEntitlementsSchema = z.object({
  maxActiveWatches: z.number().int().min(1).max(100000),
  minFrequencyMinutes: z.number().int().min(1).max(100000),
  alarmChannel: z.boolean(),
  allSounds: z.boolean(),
});
export type PlanEntitlementsDto = z.infer<typeof planEntitlementsSchema>;

/** Tüm planların yetki tablosu (admin GET/PUT yanıtı). */
export const planEntitlementsConfigSchema = z.object({
  free: planEntitlementsSchema,
  pro: planEntitlementsSchema,
});
export type PlanEntitlementsConfig = z.infer<typeof planEntitlementsConfigSchema>;

/** Admin: bir planın yetkilerini ayarla. */
export const setPlanEntitlementsInputSchema = z.object({
  plan: planSchema,
  entitlements: planEntitlementsSchema,
});
export type SetPlanEntitlementsInput = z.infer<typeof setPlanEntitlementsInputSchema>;
