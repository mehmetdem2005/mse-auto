import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { adminStatsSchema, plansSchema, setPriceInputSchema } from "@watcher/contracts";
import { getAdminStats } from "../../application/admin-stats";
import { getPlans } from "../../application/get-plans";
import { setPlanPrice } from "../../application/set-price";
import type { Container } from "../../config/container";
import type { AuthVariables } from "./auth.middleware";

export function adminRoutes(container: Container): OpenAPIHono<{ Variables: AuthVariables }> {
  const app = new OpenAPIHono<{ Variables: AuthVariables }>();

  app.openapi(
    createRoute({
      method: "get",
      path: "/analytics",
      tags: ["admin"],
      summary: "Analitik (kullanıcı/abonelik/MRR)",
      responses: {
        200: {
          content: { "application/json": { schema: adminStatsSchema } },
          description: "İstatistik",
        },
      },
    }),
    async (c) => c.json(await getAdminStats(container), 200),
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/prices",
      tags: ["admin"],
      summary: "Aktif fiyatlar",
      responses: {
        200: { content: { "application/json": { schema: plansSchema } }, description: "Fiyatlar" },
      },
    }),
    async (c) => c.json(await getPlans(container), 200),
  );

  app.openapi(
    createRoute({
      method: "put",
      path: "/prices",
      tags: ["admin"],
      summary: "Fiyat ayarla (sürümleme; grandfathering)",
      request: { body: { content: { "application/json": { schema: setPriceInputSchema } } } },
      responses: {
        200: {
          content: { "application/json": { schema: plansSchema } },
          description: "Güncel fiyatlar",
        },
      },
    }),
    async (c) => {
      const input = c.req.valid("json");
      await setPlanPrice(container, input.plan, input.interval, input.amountCents, input.currency);
      return c.json(await getPlans(container), 200);
    },
  );

  return app;
}
