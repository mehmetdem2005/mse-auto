import { type OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  adminBanInputSchema,
  adminIdParamSchema,
  adminUserDetailSchema,
  adminUserListSchema,
  errorSchema,
  giftProInputSchema,
  setAdminInputSchema,
} from "@watcher/contracts";
import type { Container } from "../../../config/container";
import type { AuthVariables } from "../auth.middleware";
import { type AdminAudit, jsonOk } from "./_shared";

/**
 * Kullanıcı yönetimi admin rotaları (ADR-137) — liste · 360° detay (ADR-101) · yetki ver/al · sil ·
 * Pro hediye · abonelik iptal · ban. Sonuç-doğuran işlemler ADR-104 denetim günlüğüne yazılır.
 * Rotalar AYNI admin app'ine kaydedilir (davranış admin.route.ts ile birebir aynı; yalnız kod taşındı).
 */
export function registerUserAdminRoutes(
  app: OpenAPIHono<{ Variables: AuthVariables }>,
  container: Container,
  audit: AdminAudit,
): void {
  app.openapi(
    createRoute({
      method: "get",
      path: "/users",
      tags: ["admin"],
      summary: "Tüm kullanıcılar (plan, admin, watcher sayısı)",
      responses: {
        200: {
          content: { "application/json": { schema: adminUserListSchema } },
          description: "Liste",
        },
      },
    }),
    async (c) => c.json(await container.adminConsole.listUsers(), 200),
  );

  // ADR-101 — kullanıcı 360° detayı (drill-down).
  app.openapi(
    createRoute({
      method: "get",
      path: "/users/{id}",
      tags: ["admin"],
      summary: "Tek kullanıcı detayı (abonelik, watcher'lar, kanallar, cihazlar, destek)",
      request: { params: adminIdParamSchema },
      responses: {
        200: {
          content: { "application/json": { schema: adminUserDetailSchema } },
          description: "Detay",
        },
        404: { content: { "application/json": { schema: errorSchema } }, description: "Yok" },
      },
    }),
    async (c) => {
      const detail = await container.adminConsole.getUserDetail(c.req.valid("param").id);
      return detail ? c.json(detail, 200) : c.json({ error: "kullanıcı bulunamadı" }, 404);
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/users/{id}/admin",
      tags: ["admin"],
      summary: "Admin yetkisi ver/al",
      request: {
        params: adminIdParamSchema,
        body: { content: { "application/json": { schema: setAdminInputSchema } } },
      },
      responses: { 200: jsonOk },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const { makeAdmin } = c.req.valid("json");
      await container.adminConsole.setAdmin(id, makeAdmin);
      await audit(
        c.get("userId"),
        makeAdmin ? "user.admin.grant" : "user.admin.revoke",
        "user",
        id,
      );
      return c.json({ ok: true }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "delete",
      path: "/users/{id}",
      tags: ["admin"],
      summary: "Kullanıcı hesabını sil (cascade)",
      request: { params: adminIdParamSchema },
      responses: { 200: jsonOk },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      await container.adminConsole.deleteUser(id);
      await audit(c.get("userId"), "user.delete", "user", id);
      return c.json({ ok: true }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/users/{id}/gift-pro",
      tags: ["admin"],
      summary: "Pro hediye et (bir dönem ücretsiz)",
      request: {
        params: adminIdParamSchema,
        body: { content: { "application/json": { schema: giftProInputSchema } } },
      },
      responses: { 200: jsonOk },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const { interval } = c.req.valid("json");
      await container.adminConsole.giftPro(id, interval);
      await audit(c.get("userId"), "user.gift_pro", "user", id, { interval });
      // ADR-134: kişiye-özel zil bildirimi (best-effort) — hediye HER ZAMAN başarılı olur; bildirim
      // başarısızsa (ör. migration henüz uygulanmadıysa) sessizce atlanır, hediye düşmez.
      try {
        await container.announcements.create({
          // ADR-135: templateKey ile istemci KULLANICI dilinde yerelleştirir (×11). title/body TR
          // yedeği (admin görünümü + şablonu tanımayan istemci için). lang=null → şablon tüm dilleri kapsar.
          templateKey: interval === "year" ? "giftProYear" : "giftProMonth",
          title: "Pro aboneliğin hazır",
          body:
            interval === "year"
              ? "Sana bir yıllık ücretsiz Pro aboneliği hediye edildi. Tüm Pro özellikleri artık açık — keyfini çıkar."
              : "Sana bir aylık ücretsiz Pro aboneliği hediye edildi. Tüm Pro özellikleri artık açık — keyfini çıkar.",
          kind: "promo",
          imageUrl: null,
          ctaLabel: null,
          ctaUrl: null,
          pinned: false,
          published: true,
          recipientUserId: id,
        });
      } catch (err) {
        container.logger.warn("gift announcement skipped", {
          userId: id,
          err: err instanceof Error ? err.message : String(err),
        });
      }
      return c.json({ ok: true }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/users/{id}/cancel-subscription",
      tags: ["admin"],
      summary: "Kullanıcının aboneliğini iptal et",
      request: { params: adminIdParamSchema },
      responses: { 200: jsonOk },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      await container.adminConsole.cancelSubscription(id);
      await audit(c.get("userId"), "user.cancel_sub", "user", id);
      return c.json({ ok: true }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/users/{id}/ban",
      tags: ["admin"],
      summary: "Kullanıcıyı banla/aktifleştir (banlı → tüm /v1'de 403)",
      request: {
        params: adminIdParamSchema,
        body: { content: { "application/json": { schema: adminBanInputSchema } } },
      },
      responses: {
        200: jsonOk,
        400: {
          content: { "application/json": { schema: errorSchema } },
          description: "Admin banlanamaz",
        },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const { banned } = c.req.valid("json");
      // Öz-kilitlenme önlemi: admin banlanamaz (ban.middleware admini banlı sanmamalı).
      if (banned && (await container.admin.isAdmin(id))) {
        return c.json({ error: "Admin banlanamaz" }, 400);
      }
      await container.moderation.setBanned(id, banned);
      await audit(c.get("userId"), banned ? "user.ban" : "user.unban", "user", id);
      return c.json({ ok: true }, 200);
    },
  );
}
