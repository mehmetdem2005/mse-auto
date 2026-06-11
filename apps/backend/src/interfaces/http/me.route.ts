import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { meSchema } from "@watcher/contracts";
import { deleteAccount } from "../../application/delete-account";
import { exportAccount } from "../../application/export-account";
import { getMe } from "../../application/get-me";
import type { Container } from "../../config/container";
import type { AuthVariables } from "./auth.middleware";

export function meRoutes(container: Container): OpenAPIHono<{ Variables: AuthVariables }> {
  const app = new OpenAPIHono<{ Variables: AuthVariables }>();
  app.openapi(
    createRoute({
      method: "get",
      path: "/",
      tags: ["me"],
      summary: "Mevcut kullanıcı (admin bayrağı dahil)",
      responses: {
        200: { content: { "application/json": { schema: meSchema } }, description: "Kullanıcı" },
      },
    }),
    async (c) => c.json(await getMe(container, c.get("userId"), c.get("email")), 200),
  );

  // Akış üst kartları için kullanıcı istatistikleri (ADR-049 — maket: "Tarama 24s").
  app.openapi(
    createRoute({
      method: "get",
      path: "/stats",
      tags: ["me"],
      summary: "Kullanıcı istatistikleri (watcher sayısı + son 24 saat tarama)",
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({
                watchers: z.number().int(),
                activeWatchers: z.number().int(),
                checks24h: z.number().int(),
              }),
            },
          },
          description: "İstatistik",
        },
      },
    }),
    async (c) => {
      const watches = await container.watches.listByUser(c.get("userId"));
      const topicIds = [...new Set(watches.map((w) => w.canonicalTopicId))];
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const checks24h = await container.monitoring.countCheckRunsSince(topicIds, since);
      return c.json(
        {
          watchers: watches.length,
          activeWatchers: watches.filter((w) => w.status === "active").length,
          checks24h,
        },
        200,
      );
    },
  );

  // Veri dökümü (KVKK m.11 / GDPR Art.15+20): kullanıcının tüm PII-zon verisi tek JSON.
  app.openapi(
    createRoute({
      method: "get",
      path: "/export",
      tags: ["me"],
      summary: "Hesap veri dökümü — taşınabilirlik (KVKK/GDPR)",
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({
                format: z.literal("whenly-account-export"),
                version: z.number().int(),
                exportedAt: z.string(),
                account: z.object({ userId: z.string(), email: z.string().nullable() }),
                watches: z.array(z.unknown()),
                subscription: z.unknown().nullable(),
                notifications: z.array(z.unknown()),
                supportTickets: z.array(z.unknown()),
              }),
            },
          },
          description: "Veri dökümü",
        },
      },
    }),
    async (c) =>
      c.json(await exportAccount(container, c.get("userId"), c.get("email") ?? null), 200),
  );

  app.openapi(
    createRoute({
      method: "delete",
      path: "/",
      tags: ["me"],
      summary: "Hesabı ve tüm verisini kalıcı sil (KVKK/GDPR)",
      responses: {
        200: {
          content: { "application/json": { schema: z.object({ ok: z.boolean() }) } },
          description: "Silindi",
        },
      },
    }),
    async (c) => {
      await deleteAccount(container, c.get("userId"));
      return c.json({ ok: true }, 200);
    },
  );
  return app;
}
