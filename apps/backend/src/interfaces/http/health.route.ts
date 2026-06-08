import { type HealthResponse, healthResponseSchema } from "@watcher/contracts";
import { Hono } from "hono";

/** Health endpoint — 12-factor disposability + Render health-check. contracts'ı tüketir (P4). */
export const healthRoute = new Hono().get("/", (c) => {
  const body: HealthResponse = healthResponseSchema.parse({
    status: "ok",
    service: "watcher-backend",
    timestamp: new Date().toISOString(),
  });
  return c.json(body);
});
