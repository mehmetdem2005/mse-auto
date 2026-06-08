import type { SubscriptionRepository } from "../domain/subscription";

/** Dönem sonunda iptal işaretler (standart: dönem bitene kadar aktif kalır). */
export async function cancelSubscription(
  deps: { subscriptions: SubscriptionRepository },
  userId: string,
): Promise<boolean> {
  const sub = await deps.subscriptions.getByUser(userId);
  if (!sub || sub.status !== "active") return false;
  await deps.subscriptions.save({ ...sub, cancelAtPeriodEnd: true });
  return true;
}
