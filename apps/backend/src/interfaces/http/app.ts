import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import type { Container } from "../../config/container";
import { adminMiddleware } from "./admin.middleware";
import { adminRoutes } from "./admin.route";
import type { AuthVariables } from "./auth.middleware";
import { authMiddleware } from "./auth.middleware";
import { billingRoutes } from "./billing.route";
import { devicesRoutes } from "./devices.route";
import { eventsRoutes } from "./events.route";
import { feedRoutes } from "./feed.route";
import { healthRoute } from "./health.route";
import { meRoutes } from "./me.route";
import { errorHandler, requestId, requestLogger } from "./observability";
import { plansRoutes } from "./plans.route";
import { onlyMethod, rateLimit } from "./rate-limit.middleware";
import { subscriptionRoutes } from "./subscription.route";
import { watchersRoutes } from "./watchers.route";
import { webhookRoutes } from "./webhook.route";

/** /health açık; /v1/* auth + rate-limit; /v1/admin/* ek admin; tümünde request-id + log. */
export function createApp(
  container: Container,
  corsOrigins?: string,
): OpenAPIHono<{ Variables: AuthVariables }> {
  const app = new OpenAPIHono<{ Variables: AuthVariables }>();

  // CORS en başta: tarayıcı OPTIONS preflight'ı auth (401) öncesi yanıtlanmalı.
  // CORS_ORIGINS verilmezse tüm origin'lere izin (Bearer token; cookie yok).
  const origins = (corsOrigins ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  app.use(
    "*",
    cors({
      origin: origins.length > 0 ? origins : "*",
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      maxAge: 86400,
    }),
  );

  // Güvenlik başlıkları (MIME-sniffing, clickjacking, referrer sızıntısı önle).
  app.use("*", async (c, next) => {
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("Referrer-Policy", "no-referrer");
    await next();
  });

  app.use("*", requestId());
  app.use("*", requestLogger(container.logger));

  app.route("/health", healthRoute);
  app.route("/webhooks", webhookRoutes(container));

  app.use("/v1/*", authMiddleware(container.auth));
  app.use("/v1/*", rateLimit(container.rateLimit.global, "global"));
  app.use("/v1/admin/*", adminMiddleware(container.admin));
  app.use(
    "/v1/watchers",
    onlyMethod("POST", rateLimit(container.rateLimit.createWatch, "watch_create")),
  );

  app.route("/v1/me", meRoutes(container));
  app.route("/v1/plans", plansRoutes(container));
  app.route("/v1/watchers", watchersRoutes(container));
  app.route("/v1/feed", feedRoutes(container));
  app.route("/v1/events", eventsRoutes(container));
  app.route("/v1/devices", devicesRoutes(container));
  app.route("/v1/subscription", subscriptionRoutes(container));
  app.route("/v1/billing", billingRoutes(container));
  app.route("/v1/admin", adminRoutes(container));

  app.doc("/openapi.json", { openapi: "3.0.0", info: { title: "Watcher API", version: "0.0.0" } });
  app.onError(errorHandler(container.logger));

  return app;
}
