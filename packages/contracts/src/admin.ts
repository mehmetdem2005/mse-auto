import { z } from "zod";
import { billingIntervalSchema } from "./subscription";

export const setPriceInputSchema = z.object({
  plan: z.literal("pro"),
  interval: billingIntervalSchema,
  amountCents: z.number().int().min(0),
  currency: z.string().default("usd"),
});
export type SetPriceInput = z.infer<typeof setPriceInputSchema>;

export const adminStatsSchema = z.object({
  totalUsers: z.number().int(),
  freeUsers: z.number().int(),
  proUsers: z.number().int(),
  activeSubscriptions: z.number().int(),
  subscriptionsByInterval: z.object({ month: z.number().int(), year: z.number().int() }),
  totalWatchers: z.number().int(),
  activeWatchers: z.number().int(),
  mrrCents: z.number().int(),
});
export type AdminStats = z.infer<typeof adminStatsSchema>;

// ---- Admin konsolu: kullanıcı / watcher / abonelik / sistem yönetimi ----

export const adminUserSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  createdAt: z.string(),
  isAdmin: z.boolean(),
  plan: z.enum(["free", "pro"]),
  watchCount: z.number().int(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;
export const adminUserListSchema = z.array(adminUserSchema);

export const adminWatchSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userEmail: z.string().nullable(),
  rawIntent: z.string(),
  archetype: z.enum(["shared", "personal"]),
  frequencyMinutes: z.number().int(),
  status: z.enum(["active", "paused"]),
  createdAt: z.string(),
});
export type AdminWatch = z.infer<typeof adminWatchSchema>;
export const adminWatchListSchema = z.array(adminWatchSchema);

export const adminSubscriptionSchema = z.object({
  userId: z.string(),
  userEmail: z.string().nullable(),
  plan: z.string(),
  interval: billingIntervalSchema.nullable(),
  amountCents: z.number().int().nullable(),
  currency: z.string(),
  status: z.string(),
  currentPeriodEnd: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean(),
});
export type AdminSubscription = z.infer<typeof adminSubscriptionSchema>;
export const adminSubscriptionListSchema = z.array(adminSubscriptionSchema);

export const adminSystemSchema = z.object({
  now: z.string(),
  backend: z.string(),
  counts: z.object({
    users: z.number().int(),
    watches: z.number().int(),
    activeWatches: z.number().int(),
    subscriptions: z.number().int(),
    deliveries: z.number().int(),
    checkRuns: z.number().int(),
  }),
  recentCheckRuns: z.array(
    z.object({
      id: z.string(),
      topicId: z.string(),
      ranAt: z.string(),
      decision: z.boolean(),
      confidence: z.number().nullable(),
      summary: z.string().nullable(),
    }),
  ),
  recentDeliveries: z.array(
    z.object({
      id: z.string(),
      status: z.string(),
      channel: z.string(),
      sentAt: z.string().nullable(),
    }),
  ),
});
export type AdminSystem = z.infer<typeof adminSystemSchema>;

// ---- Zaman serisi (istatistik & grafik) ----

/** Bir günün kovası (YYYY-MM-DD, UTC). */
export const adminTimeseriesPointSchema = z.object({
  date: z.string(), // "2026-06-09"
  checkRuns: z.number().int(),
  detections: z.number().int(),
  deliveries: z.number().int(),
});
export type AdminTimeseriesPoint = z.infer<typeof adminTimeseriesPointSchema>;

export const adminTimeseriesSchema = z.object({
  days: z.number().int(),
  points: z.array(adminTimeseriesPointSchema),
  totals: z.object({
    checkRuns: z.number().int(),
    detections: z.number().int(),
    deliveries: z.number().int(),
  }),
});
export type AdminTimeseries = z.infer<typeof adminTimeseriesSchema>;

export const adminTimeseriesQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(14),
});

export const adminIdParamSchema = z.object({ id: z.string().min(1) });
export const setAdminInputSchema = z.object({ makeAdmin: z.boolean() });
export const setWatchStatusInputSchema = z.object({ status: z.enum(["active", "paused"]) });
export const giftProInputSchema = z.object({ interval: billingIntervalSchema });
export type SetAdminInput = z.infer<typeof setAdminInputSchema>;
export type SetWatchStatusInput = z.infer<typeof setWatchStatusInputSchema>;
export type GiftProInput = z.infer<typeof giftProInputSchema>;
