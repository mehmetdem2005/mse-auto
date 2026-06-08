import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { createWatchInputSchema, errorSchema, watchSchema } from "@watcher/contracts";
import { createWatcher } from "../../application/create-watcher";
import type { Container } from "../../config/container";
import { PlanLimitError } from "../../domain/errors";
import type { AuthVariables } from "./auth.middleware";

export function watchersRoutes(container: Container): OpenAPIHono<{ Variables: AuthVariables }> {
  const app = new OpenAPIHono<{ Variables: AuthVariables }>();

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

  return app;
}
