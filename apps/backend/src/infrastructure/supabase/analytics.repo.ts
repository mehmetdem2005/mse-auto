import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminStats, AnalyticsRepository } from "../../domain/billing";
import type { Database } from "./database.types";

export class SupabaseAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async getStats(): Promise<AdminStats> {
    const nowIso = new Date().toISOString();

    const usersCount = await this.db.from("profiles").select("*", { count: "exact", head: true });
    if (usersCount.error) throw new Error(`stats users: ${usersCount.error.message}`);
    const totalUsers = usersCount.count ?? 0;

    const watchTotal = await this.db.from("watches").select("*", { count: "exact", head: true });
    if (watchTotal.error) throw new Error(`stats watches: ${watchTotal.error.message}`);
    const totalWatchers = watchTotal.count ?? 0;

    const watchActive = await this.db
      .from("watches")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");
    if (watchActive.error) throw new Error(`stats active watches: ${watchActive.error.message}`);
    const activeWatchers = watchActive.count ?? 0;

    const subs = await this.db
      .from("subscriptions")
      .select("*")
      .eq("status", "active")
      .gt("current_period_end", nowIso);
    if (subs.error) throw new Error(`stats subs: ${subs.error.message}`);
    const rows = subs.data ?? [];

    let month = 0;
    let year = 0;
    let mrrCents = 0;
    for (const r of rows) {
      const amount = r.amount_cents ?? 0;
      if (r.billing_interval === "year") {
        year += 1;
        mrrCents += Math.round(amount / 12);
      } else {
        month += 1;
        mrrCents += amount;
      }
    }
    const proUsers = rows.length;

    return {
      totalUsers,
      freeUsers: Math.max(0, totalUsers - proUsers),
      proUsers,
      activeSubscriptions: proUsers,
      subscriptionsByInterval: { month, year },
      totalWatchers,
      activeWatchers,
      mrrCents,
    };
  }
}
