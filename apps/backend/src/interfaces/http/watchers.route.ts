import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  assistChatInputSchema,
  assistReplySchema,
  createWatchInputSchema,
  errorSchema,
  setWatchStatusInputSchema,
  watchSchema,
  watchTimelineSchema,
} from "@watcher/contracts";
import { assistIntent } from "../../application/assist-intent";
import { createWatcher } from "../../application/create-watcher";
import type { Container } from "../../config/container";
import { effectivePlan } from "../../domain/billing";
import { PlanLimitError } from "../../domain/errors";
import { limitsFor } from "../../domain/plan";
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
    // Kaynak etiketi (ADR-049): konunun çözülmüş resmî alanı listede gösterilir.
    const dto = await Promise.all(
      watches.map(async (w) => {
        const [auth, topic] = await Promise.all([
          container.topics.getAuthority(w.canonicalTopicId).catch(() => ({
            domain: null,
            resolved: false,
          })),
          // "Son kontrol" nabzı (ADR-072): hız/güven hissinin arayüz karşılığı.
          container.topics
            .getById(w.canonicalTopicId)
            .catch(() => null),
        ]);
        return {
          id: w.id,
          rawIntent: w.rawIntent,
          archetype: w.archetype,
          frequencyMinutes: w.frequencyMinutes,
          status: w.status,
          createdAt: w.createdAt,
          authorityDomain: auth.domain,
          lastCheckedAt: topic?.lastCheckedAt ?? null,
        };
      }),
    );
    return c.json(dto, 200);
  });

  // ---- Kullanıcı-kapsamlı duraklat/sürdür + sil (ADR-040) ----
  const setStatus = createRoute({
    method: "post",
    path: "/{id}/status",
    tags: ["watchers"],
    summary: "Watcher'ı duraklat/sürdür (sahip)",
    request: {
      params: z.object({ id: z.string().min(1) }),
      body: { content: { "application/json": { schema: setWatchStatusInputSchema } } },
    },
    responses: {
      200: {
        content: { "application/json": { schema: watchSchema } },
        description: "Güncel watcher",
      },
      403: {
        content: { "application/json": { schema: errorSchema } },
        description: "Plan limiti aşıldı",
      },
      404: {
        content: { "application/json": { schema: errorSchema } },
        description: "Bulunamadı",
      },
    },
  });

  app.openapi(setStatus, async (c) => {
    const { id } = c.req.valid("param");
    const { status } = c.req.valid("json");
    const userId = c.get("userId");
    const watch = await container.watches.findById(id);
    if (!watch || watch.userId !== userId) return c.json({ error: "Watcher bulunamadı" }, 404);

    // Sürdürürken plan limitini uygula (oluşturma ile aynı kural).
    if (status === "active" && watch.status !== "active") {
      const sub = await container.subscriptions.getByUser(userId);
      const limits = limitsFor(effectivePlan(sub, new Date()));
      const active = (await container.watches.listByUser(userId)).filter(
        (w) => w.status === "active",
      );
      if (active.length >= limits.maxActiveWatches) {
        return c.json(
          { error: `Bu planda en fazla ${limits.maxActiveWatches} aktif watcher olabilir.` },
          403,
        );
      }
    }

    const updated = await container.watches.update(id, { status });
    return c.json(
      {
        id: updated.id,
        rawIntent: updated.rawIntent,
        archetype: updated.archetype,
        frequencyMinutes: updated.frequencyMinutes,
        status: updated.status,
        createdAt: updated.createdAt,
      },
      200,
    );
  });

  const removeWatch = createRoute({
    method: "delete",
    path: "/{id}",
    tags: ["watchers"],
    summary: "Watcher'ı sil (sahip)",
    request: { params: z.object({ id: z.string().min(1) }) },
    responses: {
      200: {
        content: { "application/json": { schema: z.object({ ok: z.boolean() }) } },
        description: "Silindi",
      },
      404: {
        content: { "application/json": { schema: errorSchema } },
        description: "Bulunamadı",
      },
    },
  });

  app.openapi(removeWatch, async (c) => {
    const { id } = c.req.valid("param");
    const watch = await container.watches.findById(id);
    if (!watch || watch.userId !== c.get("userId")) {
      return c.json({ error: "Watcher bulunamadı" }, 404);
    }
    await container.watches.delete(id);
    return c.json({ ok: true }, 200);
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
