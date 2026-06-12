import type { Subscription } from "@watcher/contracts";
import { effectivePlan } from "../domain/billing";
import { entitlementsFor, limitsFor } from "../domain/plan";
import type { WatchRepository } from "../domain/ports";
import type { SubscriptionRepository } from "../domain/subscription";
import { reconcilePlan } from "./reconcile-plan";

export interface GetSubscriptionDeps {
  subscriptions: SubscriptionRepository;
  watches: WatchRepository;
}

export async function getSubscription(
  deps: GetSubscriptionDeps,
  userId: string,
): Promise<Subscription> {
  await reconcilePlan(deps, userId);
  const sub = await deps.subscriptions.getByUser(userId);
  const plan = effectivePlan(sub, new Date());
  const limits = limitsFor(plan);
  const ent = entitlementsFor(plan);
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
