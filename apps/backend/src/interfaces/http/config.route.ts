import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { appConfigSchema } from "@watcher/contracts";
import { getChannelAvailability } from "../../application/channel-config";
import type { Container } from "../../config/container";
import type { AuthVariables } from "./auth.middleware";

/**
 * Kullanıcı uygulamasının okuduğu genel yapılandırma (ADR-107).
 * Şimdilik: admin'in açtığı ek kanallar (kanal ekranı kapalı kanalı uyarıyla gösterir).
 */
export function configRoutes(container: Container): OpenAPIHono<{ Variables: AuthVariables }> {
  const app = new OpenAPIHono<{ Variables: AuthVariables }>();
  app.openapi(
    createRoute({
      method: "get",
      path: "/",
      tags: ["config"],
      summary: "Genel yapılandırma (kanal kullanılabilirliği)",
      responses: {
        200: {
          content: { "application/json": { schema: appConfigSchema } },
          description: "Yapılandırma",
        },
      },
    }),
    async (c) => c.json({ channels: await getChannelAvailability(container.settings) }, 200),
  );
  return app;
}
