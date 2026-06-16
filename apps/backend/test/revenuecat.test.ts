import { describe, expect, it } from "vitest";
import { revenueCatToPaymentEvent } from "../src/application/revenuecat";

// ADR-159: RevenueCat (Android IAP) webhook → normalize PaymentEvent (Stripe ile ortak boru).
describe("revenueCatToPaymentEvent (ADR-159)", () => {
  it("INITIAL_PURCHASE → subscription_active (userId + aylık)", () => {
    const ev = revenueCatToPaymentEvent({
      event: { type: "INITIAL_PURCHASE", app_user_id: "u1", product_id: "whenly_pro_monthly" },
    });
    expect(ev).toMatchObject({ type: "subscription_active", userId: "u1", interval: "month" });
  });

  it("yıllık ürün → interval=year", () => {
    const ev = revenueCatToPaymentEvent({
      event: { type: "RENEWAL", app_user_id: "u1", product_id: "whenly_pro_yearly" },
    });
    expect(ev).toMatchObject({ type: "subscription_active", interval: "year" });
  });

  it("EXPIRATION → subscription_canceled", () => {
    expect(revenueCatToPaymentEvent({ event: { type: "EXPIRATION", app_user_id: "u1" } })).toEqual({
      type: "subscription_canceled",
      userId: "u1",
    });
  });

  it("CANCELLATION → ignored (dönem sonuna kadar aktif kalır; EXPIRATION bitirir)", () => {
    expect(
      revenueCatToPaymentEvent({ event: { type: "CANCELLATION", app_user_id: "u1" } }),
    ).toEqual({ type: "ignored" });
  });

  it("app_user_id yoksa → ignored", () => {
    expect(revenueCatToPaymentEvent({ event: { type: "INITIAL_PURCHASE" } })).toEqual({
      type: "ignored",
    });
  });

  it("bilinmeyen tip → ignored", () => {
    expect(revenueCatToPaymentEvent({ event: { type: "TEST", app_user_id: "u1" } })).toEqual({
      type: "ignored",
    });
  });

  it("boş gövde → ignored", () => {
    expect(revenueCatToPaymentEvent({})).toEqual({ type: "ignored" });
  });
});
