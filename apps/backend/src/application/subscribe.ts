import {
  type BillingInterval,
  type PriceRepository,
  type Subscription,
  addInterval,
} from "../domain/billing";
import type { Plan } from "../domain/plan";
import type { SubscriptionRepository } from "../domain/subscription";

export interface SubscribeDeps {
  prices: PriceRepository;
  subscriptions: SubscriptionRepository;
}

/** Abone et (gerçek sistemde ödeme webhook'u sonrası). Güncel fiyatı snapshot'lar (grandfathering). */
export async function subscribeUser(
  deps: SubscribeDeps,
  userId: string,
  plan: Plan,
  interval: BillingInterval,
  now: Date = new Date(),
): Promise<Subscription> {
  const price = await deps.prices.getActive(plan, interval);
  if (!price) throw new Error(`Fiyat tanımlı değil: ${plan}/${interval}`);
  const sub: Subscription = {
    userId,
    plan,
    interval,
    amountCents: price.amountCents,
    currency: price.currency,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: addInterval(now, interval).toISOString(),
    status: "active",
    cancelAtPeriodEnd: false,
  };
  await deps.subscriptions.save(sub);
  return sub;
}
