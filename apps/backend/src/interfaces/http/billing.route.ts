import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { billingIntervalSchema } from "@watcher/contracts";
import { startCheckout } from "../../application/billing";
import type { Container } from "../../config/container";
import type { AuthVariables } from "./auth.middleware";

export function billingRoutes(container: Container): OpenAPIHono<{ Variables: AuthVariables }> {
  const app = new OpenAPIHono<{ Variables: AuthVariables }>();
  app.openapi(
    createRoute({
      method: "post",
      path: "/checkout",
      tags: ["billing"],
      summary: "Ödeme oturumu başlat (pro abonelik)",
      request: {
        body: {
          content: {
            "application/json": { schema: z.object({ interval: billingIntervalSchema }) },
          },
        },
      },
      responses: {
        200: {
          content: { "application/json": { schema: z.object({ url: z.string() }) } },
          description: "Checkout URL",
        },
      },
    }),
    async (c) => {
      const { interval } = c.req.valid("json");
      const result = await startCheckout(
        container,
        c.get("userId"),
        interval,
        c.get("email") ?? null,
      );
      return c.json(result, 200);
    },
  );
  return app;
}
