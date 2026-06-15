import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { planFeaturesSchema, plansSchema } from "@watcher/contracts";
import { getPlans } from "../../application/get-plans";
import { getPlanFeatures } from "../../application/plan-features";
import type { Container } from "../../config/container";
import type { AuthVariables } from "./auth.middleware";

export function plansRoutes(container: Container): OpenAPIHono<{ Variables: AuthVariables }> {
  const app = new OpenAPIHono<{ Variables: AuthVariables }>();
  app.openapi(
    createRoute({
      method: "get",
      path: "/",
      tags: ["plans"],
      summary: "Aktif fiyatlar",
      responses: {
        200: { content: { "application/json": { schema: plansSchema } }, description: "Fiyatlar" },
      },
    }),
    async (c) => c.json(await getPlans(container), 200),
  );

  // ADR-139 — plan özellik-maddeleri (admin-yazılı, dile-özel). Boş → istemci i18n varsayılanı gösterir.
  app.openapi(
    createRoute({
      method: "get",
      path: "/features",
      tags: ["plans"],
      summary: "Plan özellik-maddeleri (kullanıcı diline göre)",
      request: { query: z.object({ lang: z.string().min(2).max(8).optional() }) },
      responses: {
        200: {
          content: { "application/json": { schema: planFeaturesSchema } },
          description: "Özellik maddeleri",
        },
      },
    }),
    async (c) =>
      c.json(await getPlanFeatures(container.settings, c.req.valid("query").lang ?? "tr"), 200),
  );
  return app;
}
