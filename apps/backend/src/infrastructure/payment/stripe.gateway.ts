import Stripe from "stripe";
import type { BillingInterval } from "../../domain/billing";
import type {
  CheckoutInput,
  CheckoutSession,
  PaymentEvent,
  PaymentGateway,
} from "../../domain/payment";

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  priceMonth: string;
  priceYear: string;
  appUrl: string;
}

/** Gerçek Stripe (12-factor: yalnız env'de anahtarlar varsa seçilir). */
export class StripePaymentGateway implements PaymentGateway {
  private readonly stripe: Stripe;
  constructor(private readonly cfg: StripeConfig) {
    this.stripe = new Stripe(cfg.secretKey);
  }

  async createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
    const price = input.interval === "year" ? this.cfg.priceYear : this.cfg.priceMonth;
    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: `${this.cfg.appUrl}/billing/success`,
      cancel_url: `${this.cfg.appUrl}/billing/cancel`,
      client_reference_id: input.userId,
      ...(input.email ? { customer_email: input.email } : {}),
      subscription_data: { metadata: { userId: input.userId } },
    });
    if (!session.url) throw new Error("Stripe checkout URL alınamadı");
    return { url: session.url };
  }

  parseWebhook(rawBody: string, signature: string | null): PaymentEvent {
    if (!signature) throw new Error("stripe-signature başlığı yok");
    const event = this.stripe.webhooks.constructEvent(rawBody, signature, this.cfg.webhookSecret);
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata.userId;
      if (!userId) return { type: "ignored" };
      const active = sub.status === "active" || sub.status === "trialing";
      if (event.type === "customer.subscription.deleted" || !active) {
        return { type: "subscription_canceled", userId };
      }
      const priceId = sub.items.data[0]?.price.id ?? "";
      const interval: BillingInterval = priceId === this.cfg.priceYear ? "year" : "month";
      return {
        type: "subscription_active",
        userId,
        interval,
        periodStart: new Date().toISOString(),
      };
    }
    return { type: "ignored" };
  }
}
