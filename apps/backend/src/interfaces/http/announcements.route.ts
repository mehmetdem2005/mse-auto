import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { announcementListSchema } from "@watcher/contracts";
import type { Container } from "../../config/container";
import type { AuthVariables } from "./auth.middleware";

/** Kullanıcı duyuru ucu (ADR-100) — yalnız yayınlananlar; zil → Duyurular ekranı bunu çeker. */
export function announcementsRoutes(
  container: Container,
): OpenAPIHono<{ Variables: AuthVariables }> {
  const app = new OpenAPIHono<{ Variables: AuthVariables }>();
  app.openapi(
    createRoute({
      method: "get",
      path: "/",
      tags: ["announcements"],
      summary: "Yayınlanan duyurular (sabitlenenler önce)",
      responses: {
        200: {
          content: { "application/json": { schema: announcementListSchema } },
          description: "Duyurular",
        },
      },
    }),
    async (c) => {
      // ADR-134/135: filtre burada (JS) → migration uygulanmasa da bozulmaz.
      //  - recipientUserId: global (null) + yalnız bu kullanıcı; yanıttan ÇIKARILIR (gizlilik).
      //  - lang: dil-bağımsız (null) + kullanıcının dili (?lang); templateKey'li sistem mesajları
      //    lang=null taşır → herkese gider, istemci kullanıcı dilinde yerelleştirir.
      const userId = c.get("userId");
      const lang = c.req.query("lang") ?? null;
      const visible = (await container.announcements.listPublished())
        .filter((a) => !a.recipientUserId || a.recipientUserId === userId)
        .filter((a) => !a.lang || !lang || a.lang === lang)
        .map(({ recipientUserId: _omit, ...pub }) => pub);
      return c.json(visible, 200);
    },
  );
  return app;
}
