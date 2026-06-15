import { type OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { adminSubscriptionListSchema, plansSchema, setPriceInputSchema } from "@watcher/contracts";
import { getPlans } from "../../../application/get-plans";
import { setPlanPrice } from "../../../application/set-price";
import type { Container } from "../../../config/container";
import type { AuthVariables } from "../auth.middleware";

/**
 * Fatura/fiyat & abonelik admin rotaları (ADR-137) — fiyat görüntüle/ayarla · abonelik listesi ·
 * CSV dışa aktarım (kullanıcı + abonelik). Rotalar AYNI admin app'ine kaydedilir (davranış birebir
 * aynı; yalnız kod admin.route.ts'ten buraya taşındı). Salt-okunur metotlar denetim günlüğüne yazmaz.
 */
export function registerBillingAdminRoutes(
  app: OpenAPIHono<{ Variables: AuthVariables }>,
  container: Container,
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
