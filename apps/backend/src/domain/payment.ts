import type { BillingInterval } from "./billing";

export interface CheckoutSession {
  url: string;
}

export interface CheckoutInput {
  userId: string;
  interval: BillingInterval;
  email?: string | null;
}

/** Sunucuya gelen, normalize edilmiş ödeme olayı (sağlayıcıya özgü değil). */
export type PaymentEvent =
  | { type: "subscription_active"; userId: string; interval: BillingInterval; periodStart: string }
  | { type: "subscription_canceled"; userId: string }
  | { type: "ignored" };

export interface PaymentGateway {
  /** Barındırılan ödeme oturumu oluşturur; kullanıcının yönlendirileceği URL'i döndürür. */
  createCheckout(input: CheckoutInput): Promise<CheckoutSession>;
  /** Ham gövde + imzayı doğrular, normalize PaymentEvent döndürür. İmza geçersizse fırlatır. */
  parseWebhook(rawBody: string, signature: string | null): PaymentEvent;
}
