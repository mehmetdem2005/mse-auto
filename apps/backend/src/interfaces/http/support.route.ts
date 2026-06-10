import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  createSupportInputSchema,
  errorSchema,
  supportMessageSchema,
  supportReplyInputSchema,
  supportTicketSchema,
} from "@watcher/contracts";
import { createSupportTicket } from "../../application/support";
import type { Container } from "../../config/container";
import type { AuthVariables } from "./auth.middleware";

const idParam = z.object({ id: z.string().min(1) });

/** Kullanıcı destek uçları: talep aç, taleplerim, mesajlaş (sahiplik korumalı). */
export function supportRoutes(container: Container): OpenAPIHono<{ Variables: AuthVariables }> {
  const app = new OpenAPIHono<{ Variables: AuthVariables }>();

  app.openapi(
    createRoute({
      method: "post",
      path: "/",
      tags: ["support"],
      summary: "Destek talebi aç (problem | live); canlıda adminlere push gider",
      request: { body: { content: { "application/json": { schema: createSupportInputSchema } } } },
      responses: {
        201: {
          content: { "application/json": { schema: supportTicketSchema } },
          description: "Açılan talep",
        },
      },
    }),
    async (c) => {
      const { kind, message } = c.req.valid("json");
      const t = await createSupportTicket(container, c.get("userId"), kind, message);
      return c.json(
        {
          id: t.id,
          kind: t.kind,
          status: t.status,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          lastMessage: t.lastMessage,
        },
        201,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/",
      tags: ["support"],
      summary: "Taleplerim",
      responses: {
        200: {
          content: { "application/json": { schema: z.array(supportTicketSchema) } },
          description: "Talep listesi",
        },
      },
    }),
    async (c) => {
      const rows = await container.support.listByUser(c.get("userId"));
      return c.json(
        rows.map((t) => ({
          id: t.id,
          kind: t.kind,
          status: t.status,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          lastMessage: t.lastMessage,
        })),
        200,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/{id}/messages",
      tags: ["support"],
      summary: "Talep mesajları (sahip)",
      request: { params: idParam },
      responses: {
        200: {
          content: { "application/json": { schema: z.array(supportMessageSchema) } },
          description: "Mesajlar",
        },
        404: { content: { "application/json": { schema: errorSchema } }, description: "Yok" },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const t = await container.support.findById(id);
      if (!t || t.userId !== c.get("userId")) return c.json({ error: "Talep bulunamadı" }, 404);
      return c.json(await container.support.listMessages(id), 200);
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/{id}/messages",
      tags: ["support"],
      summary: "Talebe mesaj yaz (sahip)",
      request: {
        params: idParam,
        body: { content: { "application/json": { schema: supportReplyInputSchema } } },
      },
      responses: {
        201: {
          content: { "application/json": { schema: supportMessageSchema } },
          description: "Eklenen mesaj",
        },
        404: { content: { "application/json": { schema: errorSchema } }, description: "Yok" },
      },
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const { body } = c.req.valid("json");
      const t = await container.support.findById(id);
      if (!t || t.userId !== c.get("userId")) return c.json({ error: "Talep bulunamadı" }, 404);
      const m = await container.support.addMessage(id, "user", body);
      return c.json(m, 201);
    },
  );

  return app;
}
