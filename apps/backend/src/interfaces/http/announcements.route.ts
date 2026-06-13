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
    async (c) => c.json(await container.announcements.listPublished(), 200),
  );
  return app;
}
