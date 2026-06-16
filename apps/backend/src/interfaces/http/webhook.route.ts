import { OpenAPIHono } from "@hono/zod-openapi";
import { applyPaymentEvent } from "../../application/billing";
import { type RevenueCatWebhookBody, revenueCatToPaymentEvent } from "../../application/revenuecat";
import type { Container } from "../../config/container";
import type { PaymentEvent } from "../../domain/payment";

/** Ödeme sağlayıcı webhook'ları — AUTH YOK (imza ile doğrulanır), ham gövde gerekir. */
export function webhookRoutes(container: Container): OpenAPIHono {
  const app = new OpenAPIHono();
  app.post("/stripe", async (c) => {
    const rawBody = await c.req.text();
    const signature = c.req.header("stripe-signature") ?? null;

    // İmza hatası → 400 (sağlayıcı retry ETMEZ; sahte/bozuk istek).
    let event: PaymentEvent;
    try {
      event = container.payment.parseWebhook(rawBody, signature);
    } catch {
      return c.json({ error: "imza doğrulanamadı" }, 400);
    }

    // İşleme hatası (DB vb. geçici) → 500: sağlayıcı retry eder, olay KAYBOLMAZ.
    // (Eski davranış her hatayı 400 yapıyordu → geçici hata aboneliği düşürüyordu.)
    try {
      await applyPaymentEvent(container, event);
    } catch (err) {
      container.logger.error("webhook_apply_failed", {
        eventType: event.type,
        message: err instanceof Error ? err.message : String(err),
      });
      return c.json({ error: "webhook işlenemedi" }, 500);
    }
    return c.json({ received: true }, 200);
  });

  // RevenueCat (Android IAP) webhook (ADR-159) — Authorization başlığı env gizine karşı doğrulanır;
  // RC olayı mevcut applyPaymentEvent borusuna (Stripe ile ortak) normalize edilir. Giz yoksa dormant.
  app.post("/revenuecat", async (c) => {
    const expected = container.revenueCatWebhookAuth;
    if (!expected) return c.json({ ok: true }, 200); // yapılandırılmadı → dormant, sessiz kabul
    if (c.req.header("authorization") !== expected) return c.json({ error: "yetkisiz" }, 401);
    let body: RevenueCatWebhookBody;
    try {
      body = (await c.req.json()) as RevenueCatWebhookBody;
    } catch {
      return c.json({ ok: true }, 200);
    }
    try {
      await applyPaymentEvent(container, revenueCatToPaymentEvent(body));
    } catch (err) {
      container.logger.error("revenuecat_webhook_failed", {
        message: err instanceof Error ? err.message : String(err),
      });
      return c.json({ error: "webhook işlenemedi" }, 500);
    }
    return c.json({ received: true }, 200);
  });
  return app;
}
