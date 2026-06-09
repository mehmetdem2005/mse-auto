import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { feedbackInputSchema } from "@watcher/contracts";
import type { Container } from "../../config/container";
import type { AuthVariables } from "./auth.middleware";

export function eventsRoutes(container: Container): OpenAPIHono<{ Variables: AuthVariables }> {
  const app = new OpenAPIHono<{ Variables: AuthVariables }>();
  const okSchema = z.object({ ok: z.boolean() });

  app.openapi(
    createRoute({
      method: "post",
      path: "/{id}/feedback",
      tags: ["events"],
      summary: "Tespit geri bildirimi (doğru/yanlış)",
      request: {
        params: z.object({ id: z.string().min(1) }),
        body: { content: { "application/json": { schema: feedbackInputSchema } } },
      },
      responses: {
        200: { content: { "application/json": { schema: okSchema } }, description: "Tamam" },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const { verdict } = c.req.valid("json");
      await container.monitoring.recordFeedback(c.get("userId"), id, verdict);
      return c.json({ ok: true }, 200);
    },
  );

  return app;
}
