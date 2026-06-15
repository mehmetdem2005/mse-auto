import { type OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  embeddingConfigSchema,
  errorSchema,
  llmConfigSchema,
  setEmbeddingInputSchema,
  setLlmModelInputSchema,
} from "@watcher/contracts";
import { EmbeddingConfigError } from "../../../application/embeddings-config";
import { LlmModelError } from "../../../application/llm-config";
import type { Container } from "../../../config/container";
import type { AuthVariables } from "../auth.middleware";

/**
 * Yapay zekâ yapılandırma admin rotaları (ADR-137) — global LLM modeli (ADR-095) + gömme/embedding
 * sağlayıcısı (ADR-127). Rotalar AYNI admin app'ine kaydedilir (davranış birebir aynı). Salt-okunur +
 * yapılandırma; denetim günlüğü kullanmaz (hata → 400 dürüst mesaj).
 */
export function registerAiAdminRoutes(
  app: OpenAPIHono<{ Variables: AuthVariables }>,
  container: Container,
): void {
  // ADR-095 — global LLM modeli: admin seçer, TÜM kullanıcılar seçili modelle çalışır.
  app.openapi(
    createRoute({
      method: "get",
      path: "/model",
      tags: ["admin"],
      summary: "Aktif LLM modeli + katalog (anahtar mevcudiyetiyle)",
      responses: {
        200: {
          content: { "application/json": { schema: llmConfigSchema } },
          description: "Model yapılandırması",
        },
      },
    }),
    async (c) => c.json(await container.llmRouter.getConfig(), 200),
  );

  app.openapi(
    createRoute({
      method: "put",
      path: "/model",
      tags: ["admin"],
      summary: "Global LLM modelini değiştir",
      request: { body: { content: { "application/json": { schema: setLlmModelInputSchema } } } },
      responses: {
        200: {
          content: { "application/json": { schema: llmConfigSchema } },
          description: "Güncel yapılandırma",
        },
        400: {
          content: { "application/json": { schema: errorSchema } },
          description: "Bilinmeyen model veya anahtar tanımsız",
        },
      },
    }),
    async (c) => {
      const { model } = c.req.valid("json");
      try {
        return c.json(await container.llmRouter.setActive(model), 200);
      } catch (e) {
        if (e instanceof LlmModelError) return c.json({ error: e.message }, 400);
        throw e;
      }
    },
  );

  // ADR-127 — global gömme (embedding) sağlayıcısı: RAG için; admin seçer (Gemini ücretsiz / OpenAI).
  app.openapi(
    createRoute({
      method: "get",
      path: "/embeddings",
      tags: ["admin"],
      summary: "Aktif gömme modeli + katalog (anahtar mevcudiyetiyle)",
      responses: {
        200: {
          content: { "application/json": { schema: embeddingConfigSchema } },
          description: "Gömme yapılandırması",
        },
      },
    }),
    async (c) => c.json(await container.embeddingRouter.getConfig(), 200),
  );

  app.openapi(
    createRoute({
      method: "put",
      path: "/embeddings",
      tags: ["admin"],
      summary: "Global gömme modelini değiştir",
      request: {
        body: { content: { "application/json": { schema: setEmbeddingInputSchema } } },
      },
      responses: {
        200: {
          content: { "application/json": { schema: embeddingConfigSchema } },
          description: "Güncel yapılandırma",
        },
        400: {
          content: { "application/json": { schema: errorSchema } },
          description: "Bilinmeyen model veya anahtar tanımsız",
        },
      },
    }),
    async (c) => {
      const { model } = c.req.valid("json");
      try {
        return c.json(await container.embeddingRouter.setActive(model), 200);
      } catch (e) {
        if (e instanceof EmbeddingConfigError) return c.json({ error: e.message }, 400);
        throw e;
      }
    },
  );
}
