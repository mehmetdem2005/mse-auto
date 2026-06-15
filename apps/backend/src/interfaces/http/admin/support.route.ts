import { type OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  adminIdParamSchema,
  adminSupportTicketSchema,
  supportMessageSchema,
  supportReplyInputSchema,
} from "@watcher/contracts";
import type { Container } from "../../../config/container";
import type { AuthVariables } from "../auth.middleware";
import { jsonOk } from "./_shared";

/**
 * Destek (ADR-044) admin rotaları (ADR-137) — talep listesi (açıklar önce) · talep mesajları ·
 * admin yanıtı · talebi kapat. Rotalar AYNI admin app'ine kaydedilir (davranış birebir aynı).
 */
export function registerSupportAdminRoutes(
  app: OpenAPIHono<{ Variables: AuthVariables }>,
  container: Container,
): void {
  app.openapi(
    createRoute({
      method: "get",
      path: "/support",
      tags: ["admin"],
      summary: "Tüm destek talepleri (açıklar önce)",
      responses: {
        200: {
          content: { "application/json": { schema: z.array(adminSupportTicketSchema) } },
          description: "Talepler",
        },
      },
    }),
    async (c) => {
      const rows = await container.support.listAll();
      const users = await container.adminConsole.listUsers();
      const email = new Map(users.map((u) => [u.id, u.email]));
      return c.json(
        rows.map((t) => ({
          id: t.id,
          kind: t.kind,
          status: t.status,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          lastMessage: t.lastMessage,
          userId: t.userId,
          userEmail: email.get(t.userId) ?? null,
        })),
        200,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/support/{id}/messages",
      tags: ["admin"],
      summary: "Talep mesajları (admin)",
      request: { params: adminIdParamSchema },
      responses: {
        200: {
          content: { "application/json": { schema: z.array(supportMessageSchema) } },
          description: "Mesajlar",
        },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      return c.json(await container.support.listMessages(id), 200);
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/support/{id}/reply",
      tags: ["admin"],
      summary: "Talebe admin yanıtı",
      request: {
        params: adminIdParamSchema,
        body: { content: { "application/json": { schema: supportReplyInputSchema } } },
      },
      responses: {
        201: {
          content: { "application/json": { schema: supportMessageSchema } },
          description: "Yanıt",
        },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const { body } = c.req.valid("json");
      const m = await container.support.addMessage(id, "admin", body);
      return c.json(m, 201);
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/support/{id}/close",
      tags: ["admin"],
      summary: "Talebi kapat",
      request: { params: adminIdParamSchema },
      responses: { 200: jsonOk },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      await container.support.setStatus(id, "closed");
      return c.json({ ok: true }, 200);
    },
  );
}
