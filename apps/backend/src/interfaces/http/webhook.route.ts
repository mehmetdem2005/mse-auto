import { OpenAPIHono } from "@hono/zod-openapi";
import { handlePaymentWebhook } from "../../application/billing";
import type { Container } from "../../config/container";

/** Ödeme sağlayıcı webhook'ları — AUTH YOK (imza ile doğrulanır), ham gövde gerekir. */
export function webhookRoutes(container: Container): OpenAPIHono {
  const app = new OpenAPIHono();
  app.post("/stripe", async (c) => {
    const rawBody = await c.req.text();
    const signature = c.req.header("stripe-signature") ?? null;
    try {
      await handlePaymentWebhook(container, rawBody, signature);
    } catch {
      return c.json({ error: "imza doğrulanamadı" }, 400);
    }
    return c.json({ received: true }, 200);
  });
  return app;
}
