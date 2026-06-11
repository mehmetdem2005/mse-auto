import type { FeedItemRow, MonitoringRepository } from "../domain/monitoring";
import type { WatchRepository } from "../domain/ports";
import type { SubscriptionRepository } from "../domain/subscription";
import type { SupportMessageRow, SupportRepository, SupportTicketRow } from "../domain/support";
import type { Watch } from "../domain/watch";

export interface ExportAccountDeps {
  watches: WatchRepository;
  subscriptions: SubscriptionRepository;
  support: SupportRepository;
  monitoring: MonitoringRepository;
}

/**
 * Hesap veri dökümü (KVKK m.11 / GDPR Art.15 erişim + Art.20 taşınabilirlik).
 * Tek, makinece okunabilir JSON: kullanıcının PII zonundaki TÜM verisi.
 * Paylaşılan zon (canonical_topics/check_runs) kişisel veri içermez → dökümde yok.
 */
export interface AccountExport {
  format: "whenly-account-export";
  version: number;
  exportedAt: string;
  account: { userId: string; email: string | null };
  watches: Watch[];
  subscription: unknown | null;
  notifications: FeedItemRow[];
  supportTickets: Array<SupportTicketRow & { messages: SupportMessageRow[] }>;
}

/** Bildirim dökümü üst sınırı — tek istekte makul yük (sayfalama gerekirse v2). */
const EXPORT_FEED_LIMIT = 1000;

export async function exportAccount(
  deps: ExportAccountDeps,
  userId: string,
  email: string | null,
): Promise<AccountExport> {
  const [watches, subscription, tickets, notifications] = await Promise.all([
    deps.watches.listByUser(userId),
    deps.subscriptions.getByUser(userId),
    deps.support.listByUser(userId),
    deps.monitoring.listFeed(userId, EXPORT_FEED_LIMIT),
  ]);
  const supportTickets = await Promise.all(
    tickets.map(async (tk) => ({ ...tk, messages: await deps.support.listMessages(tk.id) })),
  );
  return {
    format: "whenly-account-export",
    version: 1,
    exportedAt: new Date().toISOString(),
    account: { userId, email },
    watches,
    subscription,
    notifications,
    supportTickets,
  };
}
