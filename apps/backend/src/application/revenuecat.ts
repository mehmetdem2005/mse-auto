import type { BillingInterval } from "../domain/billing";
import type { PaymentEvent } from "../domain/payment";

/**
 * RevenueCat webhook → Pro yetkisi (ADR-159). Android IAP'da satın-alma CİHAZDA (Play Billing +
 * RevenueCat SDK) gerçekleşir; sunucu doğruluğu RevenueCat'in webhook'undan gelir. Olayı mevcut
 * `applyPaymentEvent` borusuna (Stripe ile ORTAK) normalize ederiz → tek yetki yolu. `app_user_id`
 * uygulama RC'yi başlatırken Supabase userId'sine ayarlanır → webhook doğrudan o kullanıcıya yazar.
 */
export interface RevenueCatWebhookBody {
  event?: {
    type?: string;
    app_user_id?: string;
    product_id?: string;
  };
}

/** Aboneliği AKTİF eden RC olay tipleri. */
const ACTIVE_TYPES = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "PRODUCT_CHANGE",
  "UNCANCELLATION",
  "NON_RENEWING_PURCHASE",
]);

/**
 * RC olayını normalize PaymentEvent'e çevirir. EXPIRATION = erişim bitti → iptal; CANCELLATION =
 * yenilenmeyecek ama dönem sonuna kadar aktif → şimdilik yok-say (EXPIRATION bitirir). Bilinmeyen → ignored.
 */
export function revenueCatToPaymentEvent(body: RevenueCatWebhookBody): PaymentEvent {
  const e = body.event;
  if (!e?.type || !e.app_user_id) return { type: "ignored" };
  if (e.type === "EXPIRATION") return { type: "subscription_canceled", userId: e.app_user_id };
  if (ACTIVE_TYPES.has(e.type)) {
    // Ürün ID'sinden dönem çıkar (yıllık/aylık) — gerçek ürün ID'leri bağlanınca netleşir (heuristik).
    const interval: BillingInterval = /year|annual|yıl/i.test(e.product_id ?? "")
      ? "year"
      : "month";
    return {
      type: "subscription_active",
      userId: e.app_user_id,
      interval,
      periodStart: new Date().toISOString(),
    };
  }
  return { type: "ignored" };
}
