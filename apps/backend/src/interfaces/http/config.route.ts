import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { appConfigSchema } from "@watcher/contracts";
import {
  configuredAvailability,
  effectiveAvailability,
  getChannelAvailability,
} from "../../application/channel-config";
import type { Container } from "../../config/container";
import type { AuthVariables } from "./auth.middleware";

/**
 * Kullanıcı uygulamasının okuduğu genel yapılandırma (ADR-107 + ADR-152).
 * `channels` = ETKİN kullanılabilirlik (admin AÇTI ve sunucuda kimlik bilgisi var);
 * `channelsConfigured` = sunucuda kimlik bilgisi var mı → kanal ekranı "kapalı" ile
 * "henüz hazır değil" (sunucu kurulumu gerekiyor) ayrımını dürüstçe gösterir (sessiz başarısızlık yok).
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
    async (c) => {
      const admin = await getChannelAvailability(container.settings);
      const configured = configuredAvailability(container.channels.map((ch) => ch.kind));
      return c.json(
        { channels: effectiveAvailability(admin, configured), channelsConfigured: configured },
        200,
      );
    },
  );
  return app;
}
