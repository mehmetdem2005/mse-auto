import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { feedListSchema } from "@watcher/contracts";
import type { Container } from "../../config/container";
import type { AuthVariables } from "./auth.middleware";

export function feedRoutes(container: Container): OpenAPIHono<{ Variables: AuthVariables }> {
  const app = new OpenAPIHono<{ Variables: AuthVariables }>();

  app.openapi(
    createRoute({
      method: "get",
      path: "/",
      tags: ["feed"],
      summary: "Birleşik aktivite akışı (tüm watcher'lardan tespitler)",
      responses: {
        200: {
          content: { "application/json": { schema: feedListSchema } },
          description: "Feed",
        },
      },
    }),
    async (c) => c.json(await container.monitoring.listFeed(c.get("userId"), 50), 200),
  );

  return app;
}
