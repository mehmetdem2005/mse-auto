import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
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

  // Tek teslimi okundu damgala.
  app.openapi(
    createRoute({
      method: "post",
      path: "/{deliveryId}/read",
      tags: ["feed"],
      summary: "Tek feed öğesini okundu yap",
      request: { params: z.object({ deliveryId: z.string().min(1) }) },
      responses: {
        200: {
          content: { "application/json": { schema: z.object({ ok: z.boolean() }) } },
          description: "Tamam",
        },
      },
    }),
    async (c) => {
      await container.monitoring.markDeliveryRead(c.get("userId"), c.req.valid("param").deliveryId);
      return c.json({ ok: true }, 200);
    },
  );

  // Tümünü okundu yap.
  app.openapi(
    createRoute({
      method: "post",
      path: "/read-all",
      tags: ["feed"],
      summary: "Tüm feed öğelerini okundu yap",
      responses: {
        200: {
          content: { "application/json": { schema: z.object({ count: z.number() }) } },
          description: "Okundu yapılan sayısı",
        },
      },
    }),
    async (c) => c.json({ count: await container.monitoring.markAllRead(c.get("userId")) }, 200),
  );

  return app;
}
