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
