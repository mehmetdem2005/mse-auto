import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { errorSchema, subscriptionSchema } from "@watcher/contracts";
import { cancelSubscription } from "../../application/cancel";
import { getSubscription } from "../../application/get-subscription";
import type { Container } from "../../config/container";
import type { AuthVariables } from "./auth.middleware";

export function subscriptionRoutes(
  container: Container,
): OpenAPIHono<{ Variables: AuthVariables }> {
  const app = new OpenAPIHono<{ Variables: AuthVariables }>();

  app.openapi(
    createRoute({
      method: "get",
      path: "/",
      tags: ["subscription"],
      summary: "Plan + limit + kullanım + abonelik",
      responses: {
        200: {
          content: { "application/json": { schema: subscriptionSchema } },
          description: "Durum",
        },
      },
    }),
    async (c) => c.json(await getSubscription(container, c.get("userId")), 200),
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/",
      tags: ["subscription"],
      summary: "Abone ol — devre dışı (ödeme entegrasyonu gerekli)",
      responses: {
        503: {
          content: { "application/json": { schema: errorSchema } },
          description: "Ödeme akışı kapalı",
        },
      },
    }),
    // Güvenlik: eskiden bu uç doğrudan aktif Pro yazıyordu (ödemesiz). Artık Pro
    // yalnız ödeme sağlayıcısının webhook'u üzerinden verilir (/v1/billing/checkout).
    async (c) =>
      c.json(
        { error: "Abonelik ödeme gerektirir; bu uç devre dışı. Ödeme entegrasyonu yakında." },
        503,
      ),
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/cancel",
      tags: ["subscription"],
      summary: "Dönem sonunda iptal",
      responses: {
        200: {
          content: { "application/json": { schema: subscriptionSchema } },
          description: "Güncel",
        },
        404: {
          content: { "application/json": { schema: errorSchema } },
          description: "Abonelik yok",
        },
      },
    }),
    async (c) => {
      const ok = await cancelSubscription(container, c.get("userId"));
      if (!ok) return c.json({ error: "Aktif abonelik yok" }, 404);
      return c.json(await getSubscription(container, c.get("userId")), 200);
    },
  );

  return app;
}
