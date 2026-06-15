import { type OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  adminIdParamSchema,
  adminWatchListSchema,
  errorSchema,
  setWatchStatusInputSchema,
  watchTimelineSchema,
} from "@watcher/contracts";
import type { Container } from "../../../config/container";
import type { AuthVariables } from "../auth.middleware";
import { jsonOk } from "./_shared";

/**
 * Watcher yönetimi admin rotaları (ADR-137) — tüm watcher'lar · duraklat/aktifleştir · sil ·
 * araştırma geçmişi (timeline). Rotalar AYNI admin app'ine kaydedilir (davranış birebir aynı).
 */
export function registerWatchesAdminRoutes(
  app: OpenAPIHono<{ Variables: AuthVariables }>,
  container: Container,
): void {
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
}
