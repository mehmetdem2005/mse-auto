import { effectivePlan } from "../domain/billing";
import { limitsFor } from "../domain/plan";
import type { WatchRepository } from "../domain/ports";
import type { SubscriptionRepository } from "../domain/subscription";

export interface ReconcilePlanDeps {
  subscriptions: SubscriptionRepository;
  watches: WatchRepository;
}

export interface ReconcileResult {
  paused: string[];
  resumed: string[];
  bumped: string[];
}

/**
 * Plan uzlaştırma (ADR-018). Kullanıcının watch'larını etkin plana uyumlu hale getirir:
 * - en yeni N (=maxActiveWatches) watch aktif kalır; fazlası duraklatılır (downgrade),
 * - aktif sayısı limitin altındaysa duraklatılmışlar en yeniden başlayarak aktifleştirilir (upgrade-resume),
 * - aktif watch'ların sıklığı plan minimumunun altındaysa minimuma yükseltilir (maliyet düzeltmesi).
 * İdempotent: gerek yoksa hiç yazmaz. (Manuel pause özelliği yok → tüm duraklatma sistemcedir.)
 */
export async function reconcilePlan(
  deps: ReconcilePlanDeps,
  userId: string,
  now: Date = new Date(),
): Promise<ReconcileResult> {
  const sub = await deps.subscriptions.getByUser(userId);
  const limits = limitsFor(effectivePlan(sub, now));
  const watches = await deps.watches.listByUser(userId);

  const byNewest = [...watches].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const keepActive = new Set(byNewest.slice(0, limits.maxActiveWatches).map((w) => w.id));

  const paused: string[] = [];
  const resumed: string[] = [];
  const bumped: string[] = [];

  for (const w of watches) {
    const shouldBeActive = keepActive.has(w.id);
    if (!shouldBeActive && w.status === "active") {
      await deps.watches.update(w.id, { status: "paused" });
      paused.push(w.id);
    } else if (shouldBeActive && w.status === "paused") {
      await deps.watches.update(w.id, { status: "active" });
      resumed.push(w.id);
    }
  }

  for (const w of byNewest.slice(0, limits.maxActiveWatches)) {
    if (w.frequencyMinutes < limits.minFrequencyMinutes) {
      await deps.watches.update(w.id, { frequencyMinutes: limits.minFrequencyMinutes });
      bumped.push(w.id);
    }
  }

  return { paused, resumed, bumped };
}
