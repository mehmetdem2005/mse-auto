import { type OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  adminSubscriptionListSchema,
  planEntitlementsConfigSchema,
  planFeaturesSchema,
  plansSchema,
  setPlanEntitlementsInputSchema,
  setPlanFeaturesInputSchema,
  setPriceInputSchema,
} from "@watcher/contracts";
import { getPlans } from "../../../application/get-plans";
import { getPlanEntitlements, setPlanEntitlements } from "../../../application/plan-config";
import { getPlanFeatures, setPlanFeatures } from "../../../application/plan-features";
import { setPlanPrice } from "../../../application/set-price";
import type { Container } from "../../../config/container";
import type { AuthVariables } from "../auth.middleware";
import type { AdminAudit } from "./_shared";

/**
 * Fatura/fiyat & abonelik admin rotaları (ADR-137) — fiyat görüntüle/ayarla · plan özellik-maddeleri
 * (ADR-139, dile-özel, audit) · abonelik listesi · CSV dışa aktarım. Rotalar AYNI admin app'ine
 * kaydedilir (davranış birebir aynı). Salt-okunur metotlar denetim günlüğüne yazmaz.
 */
export function registerBillingAdminRoutes(
  app: OpenAPIHono<{ Variables: AuthVariables }>,
  container: Container,
  audit: AdminAudit,
): void {
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

  // ---- ADR-139: Plan özellik-maddeleri (admin-yazılı, dile-özel; app_settings, migration YOK) ----
  app.openapi(
    createRoute({
      method: "get",
      path: "/plan-features",
      tags: ["admin"],
      summary: "Plan özellik-maddeleri (bir dil için)",
      request: { query: z.object({ lang: z.string().min(2).max(8).optional() }) },
      responses: {
        200: {
          content: { "application/json": { schema: planFeaturesSchema } },
          description: "Maddeler",
        },
      },
    }),
    async (c) =>
      c.json(await getPlanFeatures(container.settings, c.req.valid("query").lang ?? "tr"), 200),
  );

  app.openapi(
    createRoute({
      method: "put",
      path: "/plan-features",
      tags: ["admin"],
      summary: "Plan özellik-maddelerini ayarla (tek plan + tek dil)",
      request: {
        body: { content: { "application/json": { schema: setPlanFeaturesInputSchema } } },
      },
      responses: {
        200: {
          content: { "application/json": { schema: planFeaturesSchema } },
          description: "Güncel maddeler",
        },
      },
    }),
    async (c) => {
      const input = c.req.valid("json");
      const result = await setPlanFeatures(container.settings, input);
      await audit(c.get("userId"), "plan.features", "settings", null, {
        plan: input.plan,
        lang: input.lang,
        count: input.bullets.length,
      });
      return c.json(result, 200);
    },
  );

  // ---- ADR-160: Plan YETKİLERİ (admin-yapılandırılır limitler; app_settings, migration YOK) ----
  app.openapi(
    createRoute({
      method: "get",
      path: "/plan-entitlements",
      tags: ["admin"],
      summary: "Plan yetkileri (limitler) — free + pro",
      responses: {
        200: {
          content: { "application/json": { schema: planEntitlementsConfigSchema } },
          description: "Yetkiler",
        },
      },
    }),
    async (c) => c.json(await getPlanEntitlements(container.settings), 200),
  );

  app.openapi(
    createRoute({
      method: "put",
      path: "/plan-entitlements",
      tags: ["admin"],
      summary: "Bir planın yetkilerini ayarla (watcher limiti / sıklık / alarm / sesler)",
      request: {
        body: { content: { "application/json": { schema: setPlanEntitlementsInputSchema } } },
      },
      responses: {
        200: {
          content: { "application/json": { schema: planEntitlementsConfigSchema } },
          description: "Güncel yetki tablosu",
        },
      },
    }),
    async (c) => {
      const input = c.req.valid("json");
      const result = await setPlanEntitlements(container.settings, input.plan, input.entitlements);
      await audit(c.get("userId"), "plan.entitlements", "settings", null, {
        plan: input.plan,
        ...input.entitlements,
      });
      return c.json(result, 200);
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
}
