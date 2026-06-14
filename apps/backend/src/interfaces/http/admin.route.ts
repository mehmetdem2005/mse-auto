import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  adminAuditListSchema,
  adminBanInputSchema,
  adminBroadcastInputSchema,
  adminBroadcastResultSchema,
  adminGrowthSchema,
  adminIdParamSchema,
  adminOpsSchema,
  adminProvidersSchema,
  adminStatsSchema,
  adminSubscriptionListSchema,
  adminSupportTicketSchema,
  adminSystemSchema,
  adminTimeseriesQuerySchema,
  adminTimeseriesSchema,
  adminTrafficSchema,
  adminUserDetailSchema,
  adminUserListSchema,
  adminWatchListSchema,
  announcementIdParamSchema,
  announcementListSchema,
  announcementSchema,
  createAnnouncementInputSchema,
  errorSchema,
  giftProInputSchema,
  llmConfigSchema,
  plansSchema,
  setAdminInputSchema,
  setLlmModelInputSchema,
  setPriceInputSchema,
  setWatchStatusInputSchema,
  supportMessageSchema,
  supportReplyInputSchema,
  updateAnnouncementInputSchema,
  watchTimelineSchema,
} from "@watcher/contracts";
import { getAdminStats } from "../../application/admin-stats";
import { getPlans } from "../../application/get-plans";
import { LlmModelError } from "../../application/llm-config";
import { getProviderUsage } from "../../application/provider-usage";
import { setPlanPrice } from "../../application/set-price";
import type { Container } from "../../config/container";
import { summarizeTraffic, windowStart } from "../../domain/traffic";
import type { AuthVariables } from "./auth.middleware";

const okSchema = z.object({ ok: z.boolean() });
const jsonOk = { content: { "application/json": { schema: okSchema } }, description: "Tamam" };

export function adminRoutes(container: Container): OpenAPIHono<{ Variables: AuthVariables }> {
  const app = new OpenAPIHono<{ Variables: AuthVariables }>();

  // ADR-104 — denetim günlüğü yardımcısı: sonuç-doğuran admin işlemleri burada izlenir.
  const audit = (
    actorId: string,
    action: string,
    targetType: string,
    targetId: string | null = null,
    meta: Record<string, unknown> | null = null,
  ): Promise<void> =>
    container.moderation.writeAudit({ actorId, action, targetType, targetId, meta });

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

  // ADR-091 — site + uygulama trafiği (kimliksiz edinim sinyali; dinamik, hardcode yok).
  app.openapi(
    createRoute({
      method: "get",
      path: "/traffic",
      tags: ["admin"],
      summary: "Trafik özeti: site/uygulama gün serisi + kaynak kırılımı",
      request: { query: adminTimeseriesQuerySchema },
      responses: {
        200: {
          content: { "application/json": { schema: adminTrafficSchema } },
          description: "Trafik özeti",
        },
      },
    }),
    async (c) => {
      const { days } = c.req.valid("query");
      const events = await container.traffic.listSince(windowStart(days)).catch(() => []);
      return c.json(summarizeTraffic(events, days), 200);
    },
  );

  // ADR-095 — global LLM modeli: admin seçer, TÜM kullanıcılar seçili modelle çalışır.
  app.openapi(
    createRoute({
      method: "get",
      path: "/model",
      tags: ["admin"],
      summary: "Aktif LLM modeli + katalog (anahtar mevcudiyetiyle)",
      responses: {
        200: {
          content: { "application/json": { schema: llmConfigSchema } },
          description: "Model yapılandırması",
        },
      },
    }),
    async (c) => c.json(await container.llmRouter.getConfig(), 200),
  );

  app.openapi(
    createRoute({
      method: "put",
      path: "/model",
      tags: ["admin"],
      summary: "Global LLM modelini değiştir",
      request: { body: { content: { "application/json": { schema: setLlmModelInputSchema } } } },
      responses: {
        200: {
          content: { "application/json": { schema: llmConfigSchema } },
          description: "Güncel yapılandırma",
        },
        400: {
          content: { "application/json": { schema: errorSchema } },
          description: "Bilinmeyen model veya anahtar tanımsız",
        },
      },
    }),
    async (c) => {
      const { model } = c.req.valid("json");
      try {
        return c.json(await container.llmRouter.setActive(model), 200);
      } catch (e) {
        if (e instanceof LlmModelError) return c.json({ error: e.message }, 400);
        throw e;
      }
    },
  );

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

  // ADR-095 — sağlayıcı kullanım panosu: gerçek API verisi (token yoksa dürüst durum).
  app.openapi(
    createRoute({
      method: "get",
      path: "/providers",
      tags: ["admin"],
      summary: "Sağlayıcı kullanım/kota kartları (Supabase/Render/Vercel/DeepSeek/Groq)",
      responses: {
        200: {
          content: { "application/json": { schema: adminProvidersSchema } },
          description: "Kullanım kartları",
        },
      },
    }),
    async (c) => c.json(await getProviderUsage(container), 200),
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

  // ADR-102 — operasyon & sağlık özeti.
  app.openapi(
    createRoute({
      method: "get",
      path: "/ops",
      tags: ["admin"],
      summary: "Operasyon & sağlık (kontrol/tespit/token + teslimat başarı/hata)",
      request: { query: adminTimeseriesQuerySchema },
      responses: {
        200: { content: { "application/json": { schema: adminOpsSchema } }, description: "Ops" },
      },
    }),
    async (c) => c.json(await container.adminConsole.getOps(c.req.valid("query").days), 200),
  );

  // ADR-103 — gelir & büyüme.
  app.openapi(
    createRoute({
      method: "get",
      path: "/growth",
      tags: ["admin"],
      summary: "Gelir & büyüme (kayıt trendi, huni, churn, MRR)",
      request: { query: adminTimeseriesQuerySchema },
      responses: {
        200: {
          content: { "application/json": { schema: adminGrowthSchema } },
          description: "Growth",
        },
      },
    }),
    async (c) => c.json(await container.adminConsole.getGrowth(c.req.valid("query").days), 200),
  );

  // ADR-103 — CSV dışa aktarım (mevcut liste metotları yeniden kullanılır).
  const csvEscape = (v: unknown): string => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  const toCsv = (headers: string[], rows: unknown[][]): string =>
    [headers, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");

  app.get("/export/users.csv", async (c) => {
    const users = await container.adminConsole.listUsers();
    const csv = toCsv(
      ["id", "email", "createdAt", "plan", "isAdmin", "watchCount"],
      users.map((u) => [u.id, u.email, u.createdAt, u.plan, u.isAdmin, u.watchCount]),
    );
    return c.body(csv, 200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="users.csv"',
    });
  });

  app.get("/export/subscriptions.csv", async (c) => {
    const subs = await container.adminConsole.listSubscriptions();
    const csv = toCsv(
      ["userId", "email", "plan", "interval", "amountCents", "currency", "status", "periodEnd"],
      subs.map((s) => [
        s.userId,
        s.userEmail,
        s.plan,
        s.interval,
        s.amountCents,
        s.currency,
        s.status,
        s.currentPeriodEnd,
      ]),
    );
    return c.body(csv, 200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="subscriptions.csv"',
    });
  });

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

  // ---- ADR-104: Etkileşim & moderasyon (ban + push yayın + denetim günlüğü) ----
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

  app.openapi(
    createRoute({
      method: "get",
      path: "/audit",
      tags: ["admin"],
      summary: "Denetim günlüğü (son 200 admin işlemi, en yeni önce)",
      responses: {
        200: {
          content: { "application/json": { schema: adminAuditListSchema } },
          description: "Denetim kayıtları",
        },
      },
    }),
    async (c) => c.json(await container.moderation.listAudit(200), 200),
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
