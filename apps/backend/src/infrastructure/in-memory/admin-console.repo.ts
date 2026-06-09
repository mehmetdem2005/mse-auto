import type {
  AdminConsoleRepository,
  AdminSubscriptionRow,
  AdminSystemInfo,
  AdminUserRow,
  AdminWatchRow,
} from "../../domain/billing";

/**
 * Dev/in-memory admin konsolu — kalıcı yönetim verisi yok.
 * Üretimde SupabaseAdminConsoleRepository devrededir; bu yalnız tip uyumu ve
 * yerel çalıştırma içindir (boş listeler / no-op işlemler).
 */
export class InMemoryAdminConsoleRepository implements AdminConsoleRepository {
  async listUsers(): Promise<AdminUserRow[]> {
    return [];
  }
  async setAdmin(): Promise<void> {}
  async deleteUser(): Promise<void> {}
  async listWatches(): Promise<AdminWatchRow[]> {
    return [];
  }
  async setWatchStatus(): Promise<void> {}
  async deleteWatch(): Promise<void> {}
  async listSubscriptions(): Promise<AdminSubscriptionRow[]> {
    return [];
  }
  async giftPro(): Promise<void> {}
  async cancelSubscription(): Promise<void> {}
  async getSystem(): Promise<AdminSystemInfo> {
    return {
      now: new Date().toISOString(),
      backend: "in-memory",
      counts: {
        users: 0,
        watches: 0,
        activeWatches: 0,
        subscriptions: 0,
        deliveries: 0,
        checkRuns: 0,
      },
      recentCheckRuns: [],
      recentDeliveries: [],
    };
  }
}
