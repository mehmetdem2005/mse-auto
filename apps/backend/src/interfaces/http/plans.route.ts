import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { plansSchema } from "@watcher/contracts";
import { getPlans } from "../../application/get-plans";
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
  return app;
}
