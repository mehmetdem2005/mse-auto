import { type OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  channelAvailabilitySchema,
  emailPromptConfigSchema,
  setEmailPromptInputSchema,
} from "@watcher/contracts";
import {
  getChannelAvailability,
  setChannelAvailability,
} from "../../../application/channel-config";
import { getEmailPromptConfig, setEmailPromptConfig } from "../../../application/email-prompt";
import type { Container } from "../../../config/container";
import type { AuthVariables } from "../auth.middleware";
import type { AdminAudit } from "./_shared";

/**
 * Kanal & e-posta admin rotaları (ADR-137) — ek kanal aç/kapa (ADR-107) + e-posta besteci istemi
 * (ADR-109). Rotalar AYNI admin app'ine kaydedilir (davranış birebir aynı). Yazma işlemleri ADR-104
 * denetim günlüğüne yazılır (audit param).
 */
export function registerChannelsAdminRoutes(
  app: OpenAPIHono<{ Variables: AuthVariables }>,
  container: Container,
  audit: AdminAudit,
): void {
  // ---- ADR-107: Kanal kullanılabilirliği (telegram/whatsapp/email aç-kapa) ----
  app.openapi(
    createRoute({
      method: "get",
      path: "/channel-config",
      tags: ["admin"],
      summary: "Ek kanal desteği aç/kapa durumu",
      responses: {
        200: {
          content: { "application/json": { schema: channelAvailabilitySchema } },
          description: "Kanal durumu",
        },
      },
    }),
    async (c) => c.json(await getChannelAvailability(container.settings), 200),
  );

  app.openapi(
    createRoute({
      method: "put",
      path: "/channel-config",
      tags: ["admin"],
      summary: "Ek kanal desteğini aç/kapat (kapalı kanal hiç teslim edilmez)",
      request: {
        body: { content: { "application/json": { schema: channelAvailabilitySchema } } },
      },
      responses: {
        200: {
          content: { "application/json": { schema: channelAvailabilitySchema } },
          description: "Güncel durum",
        },
      },
    }),
    async (c) => {
      const v = c.req.valid("json");
      await setChannelAvailability(container.settings, v);
      await audit(c.get("userId"), "channels.config", "settings", null, v);
      return c.json(v, 200);
    },
  );

  // ---- ADR-109: E-posta LLM besteci istemi (varsayılan + özel) ----
  app.openapi(
    createRoute({
      method: "get",
      path: "/email-prompt",
      tags: ["admin"],
      summary: "E-posta besteci istemi (varsayılan + özel)",
      responses: {
        200: {
          content: { "application/json": { schema: emailPromptConfigSchema } },
          description: "İstem yapılandırması",
        },
      },
    }),
    async (c) => c.json(await getEmailPromptConfig(container.settings), 200),
  );

  app.openapi(
    createRoute({
      method: "put",
      path: "/email-prompt",
      tags: ["admin"],
      summary: "E-posta besteci istemini ayarla (varsayılan toggle + özel metin)",
      request: {
        body: { content: { "application/json": { schema: setEmailPromptInputSchema } } },
      },
      responses: {
        200: {
          content: { "application/json": { schema: emailPromptConfigSchema } },
          description: "Güncel yapılandırma",
        },
      },
    }),
    async (c) => {
      const v = c.req.valid("json");
      const cfg = await setEmailPromptConfig(container.settings, v);
      await audit(c.get("userId"), "email.prompt", "settings", null, { useDefault: v.useDefault });
      return c.json(cfg, 200);
    },
  );
}
