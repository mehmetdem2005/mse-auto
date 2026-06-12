import type { BillingInterval, PriceRepository } from "../domain/billing";
import type { PaymentEvent, PaymentGateway } from "../domain/payment";
import type { WatchRepository } from "../domain/ports";
import type { SubscriptionRepository } from "../domain/subscription";
import { reconcilePlan } from "./reconcile-plan";
import { subscribeUser } from "./subscribe";

export interface CheckoutDeps {
  payment: PaymentGateway;
}

/** Barındırılan ödeme oturumu başlatır; kullanıcı buraya yönlendirilir. */
export async function startCheckout(
  deps: CheckoutDeps,
  userId: string,
  interval: BillingInterval,
  email: string | null,
): Promise<{ url: string }> {
  const session = await deps.payment.createCheckout({ userId, interval, email });
  return { url: session.url };
}

export interface WebhookDeps {
  payment: PaymentGateway;
  prices: PriceRepository;
  subscriptions: SubscriptionRepository;
  watches: WatchRepository;
}

/**
 * Ödeme webhook'unu işler (idempotent):
 * - aktif → abone et (fiyat snapshot) + plan uzlaştır,
 * - iptal → aboneliği bitir (status canceled) + plan uzlaştır (free limitine indir).
 */
export async function handlePaymentWebhook(
  deps: WebhookDeps,
  rawBody: string,
  signature: string | null,
  now: Date = new Date(),
): Promise<void> {
  const event = deps.payment.parseWebhook(rawBody, signature);
  await applyPaymentEvent(deps, event, now);
}

/**
 * Doğrulanmış ödeme olayını uygular. Route katmanı imza hatası (400, retry yok)
 * ile işleme hatasını (500 → sağlayıcı retry eder) AYIRT edebilsin diye parse'tan ayrı.
 */
export async function applyPaymentEvent(
  deps: WebhookDeps,
  event: PaymentEvent,
  now: Date = new Date(),
): Promise<void> {
  if (event.type === "subscription_active") {
    await subscribeUser(deps, event.userId, "pro", event.interval, new Date(event.periodStart));
    await reconcilePlan(deps, event.userId, now);
  } else if (event.type === "subscription_canceled") {
    const sub = await deps.subscriptions.getByUser(event.userId);
    if (sub) await deps.subscriptions.save({ ...sub, status: "canceled", cancelAtPeriodEnd: true });
    await reconcilePlan(deps, event.userId, now);
  }
}
