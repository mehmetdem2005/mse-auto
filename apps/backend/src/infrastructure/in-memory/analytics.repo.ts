import type { AdminStats, AnalyticsRepository } from "../../domain/billing";
import { isActive, monthlyEquivalentCents } from "../../domain/billing";
import type { InMemoryStore } from "./store";

export class InMemoryAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly store: InMemoryStore) {}

  async getStats(): Promise<AdminStats> {
    const now = new Date();
    const users = new Set<string>();
    for (const w of this.store.watches) users.add(w.userId);
    for (const k of this.store.subscriptions.keys()) users.add(k);
    for (const d of this.store.deviceTokens) users.add(d.userId);

    const activeSubs = [...this.store.subscriptions.values()].filter((s) => isActive(s, now));
    const month = activeSubs.filter((s) => s.interval === "month").length;
    const year = activeSubs.filter((s) => s.interval === "year").length;
    const mrrCents = activeSubs.reduce((sum, s) => sum + monthlyEquivalentCents(s), 0);
    const totalUsers = users.size;
    const proUsers = activeSubs.length;

    return {
      totalUsers,
      freeUsers: totalUsers - proUsers,
      proUsers,
      activeSubscriptions: activeSubs.length,
      subscriptionsByInterval: { month, year },
      totalWatchers: this.store.watches.length,
      activeWatchers: this.store.watches.filter((w) => w.status === "active").length,
      mrrCents,
    };
  }
}
