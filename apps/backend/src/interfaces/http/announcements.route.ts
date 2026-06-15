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
      // ADR-134: global (recipientUserId=null) + YALNIZ bu kullanıcıya hedefli duyurular.
      // Filtre burada (JS) → migration uygulanmasa da bozulmaz; recipientUserId yanıttan çıkarılır (gizlilik).
      const userId = c.get("userId");
      const visible = (await container.announcements.listPublished())
        .filter((a) => !a.recipientUserId || a.recipientUserId === userId)
        .map(({ recipientUserId: _omit, ...pub }) => pub);
      return c.json(visible, 200);
    },
  );
  return app;
}
