import { type OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  adminBroadcastInputSchema,
  adminBroadcastResultSchema,
  announcementIdParamSchema,
  announcementListSchema,
  announcementSchema,
  createAnnouncementInputSchema,
  errorSchema,
  updateAnnouncementInputSchema,
} from "@watcher/contracts";
import type { Container } from "../../../config/container";
import type { AuthVariables } from "../auth.middleware";
import { type AdminAudit, jsonOk } from "./_shared";

/**
 * İçerik & iletişim admin rotaları (ADR-137) — duyuru CRUD (ADR-100) + push yayını (ADR-104).
 * Rotalar AYNI admin app'ine kaydedilir (davranış birebir aynı; yalnız kod admin.route.ts'ten taşındı).
 * Push yayını ADR-104 denetim günlüğüne yazar (audit param).
 */
export function registerContentAdminRoutes(
  app: OpenAPIHono<{ Variables: AuthVariables }>,
  container: Container,
  audit: AdminAudit,
): void {
  // ADR-100 — Duyurular: admin oluşturur/yönetir; kullanıcı zil ekranında görür.
  app.openapi(
    createRoute({
      method: "get",
      path: "/announcements",
      tags: ["admin"],
      summary: "Tüm duyurular (taslaklar dahil)",
      responses: {
        200: {
          content: { "application/json": { schema: announcementListSchema } },
          description: "Duyurular",
        },
      },
    }),
    async (c) => c.json(await container.announcements.listAll(), 200),
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/announcements",
      tags: ["admin"],
      summary: "Duyuru oluştur",
      request: {
        body: { content: { "application/json": { schema: createAnnouncementInputSchema } } },
      },
      responses: {
        200: {
          content: { "application/json": { schema: announcementSchema } },
          description: "Oluşturuldu",
        },
      },
    }),
    async (c) => c.json(await container.announcements.create(c.req.valid("json")), 200),
  );

  app.openapi(
    createRoute({
      method: "patch",
      path: "/announcements/{id}",
      tags: ["admin"],
      summary: "Duyuru düzenle / yayın-sabit toggle",
      request: {
        params: announcementIdParamSchema,
        body: { content: { "application/json": { schema: updateAnnouncementInputSchema } } },
      },
      responses: {
        200: {
          content: { "application/json": { schema: announcementSchema } },
          description: "Güncellendi",
        },
        404: { content: { "application/json": { schema: errorSchema } }, description: "Yok" },
      },
    }),
    async (c) => {
      const updated = await container.announcements.update(
        c.req.valid("param").id,
        c.req.valid("json"),
      );
      return updated ? c.json(updated, 200) : c.json({ error: "duyuru bulunamadı" }, 404);
    },
  );

  app.openapi(
    createRoute({
      method: "delete",
      path: "/announcements/{id}",
      tags: ["admin"],
      summary: "Duyuru sil",
      request: { params: announcementIdParamSchema },
      responses: { 200: jsonOk },
    }),
    async (c) => {
      await container.announcements.remove(c.req.valid("param").id);
      return c.json({ ok: true }, 200);
    },
  );

  // ---- ADR-104: Push yayını (segment: all/free/pro) → denetim günlüğüne yazılır ----
  app.openapi(
    createRoute({
      method: "post",
      path: "/broadcast",
      tags: ["admin"],
      summary: "Push yayını gönder (segment: all/free/pro)",
      request: { body: { content: { "application/json": { schema: adminBroadcastInputSchema } } } },
      responses: {
        200: {
          content: { "application/json": { schema: adminBroadcastResultSchema } },
          description: "Yayın sonucu (FCM yoksa channel=inactive)",
        },
      },
    }),
    async (c) => {
      const { title, body, segment } = c.req.valid("json");
      // DÜRÜST: FCM yapılandırılmamışsa gerçekten gönderilmez → "kanal pasif" döner.
      if (!container.pushActive) {
        await audit(c.get("userId"), "broadcast.inactive", "broadcast", null, { segment });
        return c.json(
          { channel: "inactive" as const, segment, recipients: 0, sent: 0, failed: 0 },
          200,
        );
      }
      const tokens = await container.adminConsole.segmentTokens(segment);
      const results = await Promise.all(
        tokens.map((token) =>
          container.notifier.send({ token, title, body, data: { type: "broadcast" } }),
        ),
      );
      const sent = results.filter((r) => r.success).length;
      await audit(c.get("userId"), "broadcast.send", "broadcast", null, {
        segment,
        recipients: tokens.length,
        sent,
      });
      return c.json(
        {
          channel: "fcm" as const,
          segment,
          recipients: tokens.length,
          sent,
          failed: tokens.length - sent,
        },
        200,
      );
    },
  );
}
