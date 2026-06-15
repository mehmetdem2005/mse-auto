import { type OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  adminAuditListSchema,
  adminGrowthSchema,
  adminOpsSchema,
  adminProvidersSchema,
  adminStatsSchema,
  adminSystemSchema,
  adminTimeseriesQuerySchema,
  adminTimeseriesSchema,
  adminTrafficSchema,
} from "@watcher/contracts";
import { getAdminStats } from "../../../application/admin-stats";
import { getProviderUsage } from "../../../application/provider-usage";
import type { Container } from "../../../config/container";
import { summarizeTraffic, windowStart } from "../../../domain/traffic";
import type { AuthVariables } from "../auth.middleware";

/**
 * Sistem · analitik · denetim admin rotaları (ADR-137) — analitik (ADR-103) · zaman serisi · trafik
 * (ADR-091) · sağlayıcı kullanımı (ADR-095) · operasyon (ADR-102) · büyüme (ADR-103) · denetim
 * günlüğü (ADR-104) · sistem durumu. Hepsi salt-okunur gözlem; AYNI admin app'ine kaydedilir.
 */
export function registerSystemAdminRoutes(
  app: OpenAPIHono<{ Variables: AuthVariables }>,
  container: Container,
): void {
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

  // ADR-104 — denetim günlüğü (push yayını → admin/content.route.ts; yazımlar audit helper ile).
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
}
