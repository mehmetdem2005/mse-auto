import type { SupabaseClient } from "@supabase/supabase-js";
import type { BillingInterval, Price, PriceRepository } from "../../domain/billing";
import type { Plan } from "../../domain/plan";
import type { Database } from "./database.types";

type PriceRow = Database["public"]["Tables"]["plan_prices"]["Row"];

function toDomain(row: PriceRow): Price {
  return {
    plan: "pro",
    interval: row.billing_interval,
    amountCents: row.amount_cents,
    currency: row.currency,
    active: row.active,
  };
}

export class SupabasePriceRepository implements PriceRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async listActive(): Promise<Price[]> {
    const { data, error } = await this.db.from("plan_prices").select("*").eq("active", true);
    if (error) throw new Error(`prices list: ${error.message}`);
    return (data ?? []).map(toDomain);
  }

  async getActive(plan: Plan, interval: BillingInterval): Promise<Price | null> {
    const { data, error } = await this.db
      .from("plan_prices")
      .select("*")
      .eq("plan", plan)
      .eq("billing_interval", interval)
      .eq("active", true)
      .maybeSingle();
    if (error) throw new Error(`price get: ${error.message}`);
    return data ? toDomain(data) : null;
  }

  async setPrice(
    plan: Plan,
    interval: BillingInterval,
    amountCents: number,
    currency: string,
  ): Promise<void> {
    const deact = await this.db
      .from("plan_prices")
      .update({ active: false })
      .eq("plan", plan)
      .eq("billing_interval", interval)
      .eq("active", true);
    if (deact.error) throw new Error(`price deactivate: ${deact.error.message}`);
    const ins = await this.db.from("plan_prices").insert({
      plan,
      billing_interval: interval,
      amount_cents: amountCents,
      currency,
      active: true,
    });
    if (ins.error) throw new Error(`price insert: ${ins.error.message}`);
  }
}
