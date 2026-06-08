import type { BillingInterval, Price, PriceRepository } from "../../domain/billing";
import type { Plan } from "../../domain/plan";
import type { InMemoryStore } from "./store";

export class InMemoryPriceRepository implements PriceRepository {
  constructor(private readonly store: InMemoryStore) {}

  async listActive(): Promise<Price[]> {
    return this.store.prices.filter((p) => p.active);
  }

  async getActive(plan: Plan, interval: BillingInterval): Promise<Price | null> {
    return (
      this.store.prices.find((p) => p.active && p.plan === plan && p.interval === interval) ?? null
    );
  }

  async setPrice(
    plan: Plan,
    interval: BillingInterval,
    amountCents: number,
    currency: string,
  ): Promise<void> {
    for (const p of this.store.prices) {
      if (p.active && p.plan === plan && p.interval === interval) p.active = false;
    }
    this.store.prices.push({ plan, interval, amountCents, currency, active: true });
  }
}
