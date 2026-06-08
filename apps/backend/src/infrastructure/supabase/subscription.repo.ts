import type { SupabaseClient } from "@supabase/supabase-js";
import type { Subscription } from "../../domain/billing";
import type { SubscriptionRepository } from "../../domain/subscription";
import type { Database } from "./database.types";

export class SupabaseSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async getByUser(userId: string): Promise<Subscription | null> {
    const { data, error } = await this.db
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(`subscription get: ${error.message}`);
    if (!data) return null;
    if (
      data.billing_interval === null ||
      data.amount_cents === null ||
      data.current_period_start === null ||
      data.current_period_end === null
    ) {
      return null; // faturalama alanları yoksa abonelik yok say
    }
    return {
      userId: data.user_id,
      plan: "pro",
      interval: data.billing_interval,
      amountCents: data.amount_cents,
      currency: data.currency,
      currentPeriodStart: data.current_period_start,
      currentPeriodEnd: data.current_period_end,
      status: data.status === "canceled" ? "canceled" : "active",
      cancelAtPeriodEnd: data.cancel_at_period_end,
    };
  }

  async save(sub: Subscription): Promise<void> {
    const { error } = await this.db.from("subscriptions").upsert(
      {
        user_id: sub.userId,
        plan: sub.plan,
        billing_interval: sub.interval,
        amount_cents: sub.amountCents,
        currency: sub.currency,
        current_period_start: sub.currentPeriodStart,
        current_period_end: sub.currentPeriodEnd,
        status: sub.status,
        cancel_at_period_end: sub.cancelAtPeriodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(`subscription save: ${error.message}`);
  }
}
