import type { BillingInterval, PriceRepository } from "../domain/billing";
import type { Plan } from "../domain/plan";

/** Admin fiyat değişimi → yeni aktif fiyat (sürümleme). Mevcut abonelikler dönem sonuna dek etkilenmez. */
export async function setPlanPrice(
  deps: { prices: PriceRepository },
  plan: Plan,
  interval: BillingInterval,
  amountCents: number,
  currency: string,
): Promise<void> {
  await deps.prices.setPrice(plan, interval, amountCents, currency);
}
