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
    personalFilters: z.boolean(),
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
