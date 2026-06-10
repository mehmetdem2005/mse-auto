import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  assistChatInputSchema,
  assistReplySchema,
  createWatchInputSchema,
  errorSchema,
  watchSchema,
  watchTimelineSchema,
} from "@watcher/contracts";
import { assistIntent } from "../../application/assist-intent";
import { createWatcher } from "../../application/create-watcher";
import type { Container } from "../../config/container";
import { PlanLimitError } from "../../domain/errors";
import type { AuthVariables } from "./auth.middleware";

export function watchersRoutes(container: Container): OpenAPIHono<{ Variables: AuthVariables }> {
  const app = new OpenAPIHono<{ Variables: AuthVariables }>();

  const assist = createRoute({
    method: "post",
    path: "/assist",
    tags: ["watchers"],
    summary: "Niyet asistanı (sohbetle netleştirme)",
    request: {
      body: { content: { "application/json": { schema: assistChatInputSchema } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: assistReplySchema } },
        description: "Netleştirme sorusu veya hazır niyet",
      },
      503: {
        content: { "application/json": { schema: errorSchema } },
        description: "Asistan geçici olarak erişilemez (LLM hatası)",
      },
    },
  });

  app.openapi(assist, async (c) => {
    const input = c.req.valid("json");
    try {
      const reply = await assistIntent(container, input);
      return c.json(reply, 200);
    } catch (err) {
      // LLM ağ/parse hataları geçicidir; 500 yerine eyleme dönük 503 dön.
      container.logger.warn("assist failed", {
        err: err instanceof Error ? err.message : String(err),
      });
      return c.json({ error: "Asistan şu an yanıt veremiyor; az sonra tekrar dene." }, 503);
    }
  });

  const createWatch = createRoute({
    method: "post",
    path: "/",
    tags: ["watchers"],
    summary: "Watcher oluştur",
    request: {
      body: { content: { "application/json": { schema: createWatchInputSchema } } },
    },
    responses: {
      201: {
        content: { "application/json": { schema: watchSchema } },
        description: "Oluşturulan watcher",
      },
      403: {
        content: { "application/json": { schema: errorSchema } },
        description: "Plan limiti aşıldı",
      },
    },
  });

  app.openapi(createWatch, async (c) => {
    const input = c.req.valid("json");
    try {
      const watch = await createWatcher(container, c.get("userId"), input);
      return c.json(watch, 201);
    } catch (err) {
      if (err instanceof PlanLimitError) return c.json({ error: err.message }, 403);
      throw err;
    }
  });

  const listWatches = createRoute({
    method: "get",
    path: "/",
    tags: ["watchers"],
    summary: "Watcher listele",
    responses: {
      200: {
        content: { "application/json": { schema: z.array(watchSchema) } },
        description: "Watcher listesi",
      },
    },
  });

  app.openapi(listWatches, async (c) => {
    const watches = await container.watches.listByUser(c.get("userId"));
    const dto = watches.map((w) => ({
      id: w.id,
      rawIntent: w.rawIntent,
      archetype: w.archetype,
      frequencyMinutes: w.frequencyMinutes,
      status: w.status,
      createdAt: w.createdAt,
    }));
    return c.json(dto, 200);
  });

  const timeline = createRoute({
    method: "get",
    path: "/{id}/timeline",
    tags: ["watchers"],
    summary: "Watcher araştırma geçmişi (kontroller + tespitler)",
    request: { params: z.object({ id: z.string().min(1) }) },
    responses: {
      200: {
        content: { "application/json": { schema: watchTimelineSchema } },
        description: "Araştırma geçmişi",
      },
      404: {
        content: { "application/json": { schema: errorSchema } },
        description: "Watcher bulunamadı",
      },
    },
  });

  app.openapi(timeline, async (c) => {
    const { id } = c.req.valid("param");
    const watch = await container.watches.findById(id);
    if (!watch || watch.userId !== c.get("userId")) {
      return c.json({ error: "Watcher bulunamadı" }, 404);
    }
    const [checkRuns, events] = await Promise.all([
      container.monitoring.listCheckRuns(watch.canonicalTopicId, 30),
      container.monitoring.listDetectionEvents(watch.canonicalTopicId, 30),
    ]);
    return c.json({ checkRuns, events }, 200);
  });

  return app;
}
