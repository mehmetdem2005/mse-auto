import type {
  CheckoutInput,
  CheckoutSession,
  PaymentEvent,
  PaymentGateway,
} from "../../domain/payment";

/** Dev/test: gerçek Stripe yok. Checkout sahte URL döndürür; webhook gövdesini JSON olarak okur (imza yok). */
export class InMemoryPaymentGateway implements PaymentGateway {
  constructor(private readonly appUrl: string) {}

  async createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
    return {
      url: `${this.appUrl}/billing/success?dev=1&interval=${input.interval}&user=${input.userId}`,
    };
  }

  parseWebhook(rawBody: string, _signature: string | null): PaymentEvent {
    const parsed = JSON.parse(rawBody) as Partial<PaymentEvent>;
    if (
      parsed.type === "subscription_active" ||
      parsed.type === "subscription_canceled" ||
      parsed.type === "ignored"
    ) {
      return parsed as PaymentEvent;
    }
    return { type: "ignored" };
  }
}
