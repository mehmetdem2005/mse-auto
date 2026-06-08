import type { AdminStats } from "@watcher/contracts";
import type { AnalyticsRepository } from "../domain/billing";

export async function getAdminStats(deps: { analytics: AnalyticsRepository }): Promise<AdminStats> {
  return deps.analytics.getStats();
}
