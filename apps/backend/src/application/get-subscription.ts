import type { Subscription } from "@watcher/contracts";
import { effectivePlan } from "../domain/billing";
import { entitlementsFor } from "../domain/plan";
import type { WatchRepository } from "../domain/ports";
import type { SettingsRepository } from "../domain/settings";
import type { SubscriptionRepository } from "../domain/subscription";
import { getEntitlements } from "./plan-config";
import { reconcilePlan } from "./reconcile-plan";

export interface GetSubscriptionDeps {
  subscriptions: SubscriptionRepository;
  watches: WatchRepository;
  /** ADR-160: verilirse admin-yapılandırılır yetkiler okunur; yoksa statik varsayılan (geri-uyumlu). */
  settings?: SettingsRepository | undefined;
}

export async function getSubscription(
  deps: GetSubscriptionDeps,
  userId: string,
): Promise<Subscription> {
  await reconcilePlan(deps, userId);
  const sub = await deps.subscriptions.getByUser(userId);
  const plan = effectivePlan(sub, new Date());
  const ent = deps.settings ? await getEntitlements(deps.settings, plan) : entitlementsFor(plan);
  const limits = {
    maxActiveWatches: ent.maxActiveWatches,
    minFrequencyMinutes: ent.minFrequencyMinutes,
  };
  const activeWatches = (await deps.watches.listByUser(userId)).filter(
    (w) => w.status === "active",
  ).length;

  return {
    plan,
    limits: {
      maxActiveWatches: limits.maxActiveWatches,
      minFrequencyMinutes: limits.minFrequencyMinutes,
    },
    entitlements: {
      maxActiveWatches: ent.maxActiveWatches,
      minFrequencyMinutes: ent.minFrequencyMinutes,
      alarmChannel: ent.alarmChannel,
      allSounds: ent.allSounds,
    },
    usage: { activeWatches },
    subscription: sub
      ? {
          interval: sub.interval,
          amountCents: sub.amountCents,
          currency: sub.currency,
          currentPeriodEnd: sub.currentPeriodEnd,
          status: sub.status,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        }
      : null,
  };
}
