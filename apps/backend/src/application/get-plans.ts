import type { Plans } from "@watcher/contracts";
import type { PriceRepository } from "../domain/billing";

export async function getPlans(deps: { prices: PriceRepository }): Promise<Plans> {
  const prices = await deps.prices.listActive();
  return {
    prices: prices.map((p) => ({
      plan: p.plan,
      interval: p.interval,
      amountCents: p.amountCents,
      currency: p.currency,
    })),
  };
}
