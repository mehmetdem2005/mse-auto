import { type PriceRepository, addInterval } from "../domain/billing";
import type { SubscriptionRepository } from "../domain/subscription";

export interface RenewDeps {
  prices: PriceRepository;
  subscriptions: SubscriptionRepository;
}

/**
 * Dönemi biten aboneliği yeniler (cron/billing). cancelAtPeriodEnd ise iptal;
 * değilse GÜNCEL fiyat uygulanır (grandfathering dönem sonunda biter) ve dönem uzar.
 */
export async function renewSubscription(
  deps: RenewDeps,
  userId: string,
  now: Date = new Date(),
): Promise<"renewed" | "canceled" | "noop"> {
  const sub = await deps.subscriptions.getByUser(userId);
  if (!sub || sub.status !== "active") return "noop";
  if (new Date(sub.currentPeriodEnd).getTime() > now.getTime()) return "noop"; // dönem sürüyor

  if (sub.cancelAtPeriodEnd) {
    await deps.subscriptions.save({ ...sub, status: "canceled" });
    return "canceled";
  }
  const price = await deps.prices.getActive(sub.plan, sub.interval);
  const start = sub.currentPeriodEnd;
  await deps.subscriptions.save({
    ...sub,
    amountCents: price ? price.amountCents : sub.amountCents,
    currency: price ? price.currency : sub.currency,
    currentPeriodStart: start,
    currentPeriodEnd: addInterval(new Date(start), sub.interval).toISOString(),
  });
  return "renewed";
}
