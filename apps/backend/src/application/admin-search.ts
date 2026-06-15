import type { AdminSearch } from "@watcher/contracts";
import type { AdminConsoleRepository } from "../domain/billing";

const LIMIT = 12;
const MIN = 2;

/**
 * Admin global arama (ADR-149) — tek sorguyla kullanıcı (e-posta/id) · watcher (niyet/e-posta/id) ·
 * abonelik (e-posta/id) eşleşmeleri. Application-katmanı: mevcut liste metotlarını süzer (yeni repo
 * yüzeyi YOK). DÜRÜST ölçek notu: tüm listeyi çekip süzer → küçük veri için uygun; büyürse DB ILIKE'a taşınır.
 */
export async function searchAdmin(
  deps: { adminConsole: AdminConsoleRepository },
  query: string,
): Promise<AdminSearch> {
  const q = query.trim().toLowerCase();
  if (q.length < MIN) return { users: [], watches: [], subscriptions: [] };

  const [users, watches, subscriptions] = await Promise.all([
    deps.adminConsole.listUsers(),
    deps.adminConsole.listWatches(),
    deps.adminConsole.listSubscriptions(),
  ]);
  const has = (...parts: (string | null | undefined)[]): boolean =>
    parts.some((p) => (p ?? "").toLowerCase().includes(q));

  return {
    users: users.filter((u) => has(u.email, u.id)).slice(0, LIMIT),
    watches: watches.filter((w) => has(w.rawIntent, w.userEmail, w.id, w.userId)).slice(0, LIMIT),
    subscriptions: subscriptions.filter((s) => has(s.userEmail, s.userId)).slice(0, LIMIT),
  };
}
