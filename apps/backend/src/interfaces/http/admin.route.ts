import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  adminIdParamSchema,
  adminStatsSchema,
  adminSubscriptionListSchema,
  adminSupportTicketSchema,
  adminSystemSchema,
  adminTimeseriesQuerySchema,
  adminTimeseriesSchema,
  adminUserListSchema,
  adminWatchListSchema,
  errorSchema,
  giftProInputSchema,
  plansSchema,
  setAdminInputSchema,
  setPriceInputSchema,
  setWatchStatusInputSchema,
  supportMessageSchema,
  supportReplyInputSchema,
  watchTimelineSchema,
} from "@watcher/contracts";
import { getAdminStats } from "../../application/admin-stats";
import { getPlans } from "../../application/get-plans";
import { setPlanPrice } from "../../application/set-price";
import type { Container } from "../../config/container";
import type { AuthVariables } from "./auth.middleware";

const okSchema = z.object({ ok: z.boolean() });
const jsonOk = { content: { "application/json": { schema: okSchema } }, description: "Tamam" };

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
      path: "/timeseries",
      tags: ["admin"],
      summary: "Günlük zaman serisi (kontrol/tespit/teslimat)",
      request: { query: adminTimeseriesQuerySchema },
      responses: {
        200: {
          content: { "application/json": { schema: adminTimeseriesSchema } },
          description: "Zaman serisi",
        },
      },
    }),
    async (c) => {
      const { days } = c.req.valid("query");
      return c.json(await container.adminConsole.getTimeseries(days), 200);
    },
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

  // ---- Kullanıcı yönetimi ----
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
      return c.json({ ok: true }, 200);
    },
  );

  // ---- Watcher yönetimi ----
  app.openapi(
    createRoute({
      method: "get",
      path: "/watches",
      tags: ["admin"],
      summary: "Tüm watcher'lar (kullanıcı e-postasıyla)",
      responses: {
        200: {
          content: { "application/json": { schema: adminWatchListSchema } },
          description: "Liste",
        },
      },
    }),
    async (c) => c.json(await container.adminConsole.listWatches(), 200),
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/watches/{id}/status",
      tags: ["admin"],
      summary: "Watcher'ı duraklat/aktifleştir",
      request: {
        params: adminIdParamSchema,
        body: { content: { "application/json": { schema: setWatchStatusInputSchema } } },
      },
      responses: { 200: jsonOk },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const { status } = c.req.valid("json");
      await container.adminConsole.setWatchStatus(id, status);
      return c.json({ ok: true }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "delete",
      path: "/watches/{id}",
      tags: ["admin"],
      summary: "Watcher'ı sil",
      request: { params: adminIdParamSchema },
      responses: { 200: jsonOk },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      await container.adminConsole.deleteWatch(id);
      return c.json({ ok: true }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/watches/{id}/timeline",
      tags: ["admin"],
      summary: "Watcher araştırma geçmişi (herhangi bir kullanıcı)",
      request: { params: adminIdParamSchema },
      responses: {
        200: {
          content: { "application/json": { schema: watchTimelineSchema } },
          description: "Araştırma geçmişi",
        },
        404: {
          content: { "application/json": { schema: errorSchema } },
          description: "Bulunamadı",
        },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const watch = await container.watches.findById(id);
      if (!watch) return c.json({ error: "Watcher bulunamadı" }, 404);
      const [checkRuns, events] = await Promise.all([
        container.monitoring.listCheckRuns(watch.canonicalTopicId, 30),
        container.monitoring.listDetectionEvents(watch.canonicalTopicId, 30),
      ]);
      return c.json({ checkRuns, events }, 200);
    },
  );

  // ---- Abonelik yönetimi ----
  app.openapi(
    createRoute({
      method: "get",
      path: "/subscriptions",
      tags: ["admin"],
      summary: "Tüm abonelikler",
      responses: {
        200: {
          content: { "application/json": { schema: adminSubscriptionListSchema } },
          description: "Liste",
        },
      },
    }),
    async (c) => c.json(await container.adminConsole.listSubscriptions(), 200),
  );

  // ---- Destek (ADR-044) ----
  app.openapi(
    createRoute({
      method: "get",
      path: "/support",
      tags: ["admin"],
      summary: "Tüm destek talepleri (açıklar önce)",
      responses: {
        200: {
          content: { "application/json": { schema: z.array(adminSupportTicketSchema) } },
          description: "Talepler",
        },
      },
    }),
    async (c) => {
      const rows = await container.support.listAll();
      const users = await container.adminConsole.listUsers();
      const email = new Map(users.map((u) => [u.id, u.email]));
      return c.json(
        rows.map((t) => ({
          id: t.id,
          kind: t.kind,
          status: t.status,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          lastMessage: t.lastMessage,
          userId: t.userId,
          userEmail: email.get(t.userId) ?? null,
        })),
        200,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/support/{id}/messages",
      tags: ["admin"],
      summary: "Talep mesajları (admin)",
      request: { params: adminIdParamSchema },
      responses: {
        200: {
          content: { "application/json": { schema: z.array(supportMessageSchema) } },
          description: "Mesajlar",
        },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      return c.json(await container.support.listMessages(id), 200);
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/support/{id}/reply",
      tags: ["admin"],
      summary: "Talebe admin yanıtı",
      request: {
        params: adminIdParamSchema,
        body: { content: { "application/json": { schema: supportReplyInputSchema } } },
      },
      responses: {
        201: {
          content: { "application/json": { schema: supportMessageSchema } },
          description: "Yanıt",
        },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const { body } = c.req.valid("json");
      const m = await container.support.addMessage(id, "admin", body);
      return c.json(m, 201);
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/support/{id}/close",
      tags: ["admin"],
      summary: "Talebi kapat",
      request: { params: adminIdParamSchema },
      responses: { 200: jsonOk },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      await container.support.setStatus(id, "closed");
      return c.json({ ok: true }, 200);
    },
  );

  // ---- Sistem / loglar ----
  app.openapi(
    createRoute({
      method: "get",
      path: "/system",
      tags: ["admin"],
      summary: "Sistem durumu (sayaçlar, son kontroller/teslimatlar)",
      responses: {
        200: {
          content: { "application/json": { schema: adminSystemSchema } },
          description: "Durum",
        },
      },
    }),
    async (c) =>
      c.json(
        { ...(await container.adminConsole.getSystem()), services: container.serviceHealth },
        200,
      ),
  );

  return app;
}
