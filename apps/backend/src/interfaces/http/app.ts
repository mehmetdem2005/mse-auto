import { OpenAPIHono } from "@hono/zod-openapi";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { timeout } from "hono/timeout";
import type { Container } from "../../config/container";
import { adminMiddleware } from "./admin.middleware";
import { adminRoutes } from "./admin.route";
import { announcementsRoutes } from "./announcements.route";
import type { AuthVariables } from "./auth.middleware";
import { authMiddleware } from "./auth.middleware";
import { banGuard } from "./ban.middleware";
import { billingRoutes } from "./billing.route";
import { devicesRoutes } from "./devices.route";
import { eventsRoutes } from "./events.route";
import { feedRoutes } from "./feed.route";
import { healthRoute } from "./health.route";
import { meRoutes } from "./me.route";
import { errorHandler, notFoundHandler, requestId, requestLogger } from "./observability";
import { plansRoutes } from "./plans.route";
import { onlyMethod, rateLimit } from "./rate-limit.middleware";
import { subscriptionRoutes } from "./subscription.route";
import { supportRoutes } from "./support.route";
import { telemetryRoutes } from "./telemetry.route";
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

  // Güvenlik başlıkları (MIME-sniffing, clickjacking, referrer sızıntısı,
  // protokol düşürme, gereksiz tarayıcı yetkileri önle). HSTS yalnız HTTPS'te
  // tarayıcı tarafından uygulanır; düz HTTP'de (lokal dev) spec gereği yok sayılır.
  app.use("*", async (c, next) => {
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("Referrer-Policy", "no-referrer");
    c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    await next();
  });

  app.use("*", requestId());
  app.use("*", requestLogger(container.logger));
  // DoS önlemi: JSON gövdeleri küçüktür; 1 MB üstü → 413 (errorHandler zarflar).
  app.use("*", bodyLimit({ maxSize: 1024 * 1024 }));

  app.route("/health", healthRoute);
  app.route("/webhooks", webhookRoutes(container));

  // Kimliksiz trafik beacon'ı (ADR-091): AUTH ÖNCESİ (site ziyaretçisinin hesabı yok).
  // IP, X-Forwarded-For'un SAĞINDAN alınır: soldaki girdiler istemci-kontrollüdür
  // (spoof ile kova atlatılır), sağdakini güvenilir edge proxy ekler (güvenlik bulgusu).
  // Ek savunma: XFF rotasyonuna karşı tüm kaynaklar için KÜRESEL tavan.
  app.use("/t", async (c, next) => {
    const xff = c.req.header("x-forwarded-for") ?? "";
    const ip = ((xff.split(",").at(-1) ?? "").trim() || "ip-yok").slice(0, 64);
    const perIp = container.rateLimit.telemetry.hit(`t:${ip}`);
    const global = container.rateLimit.telemetryGlobal.hit("t:tum");
    if (!perIp.allowed || !global.allowed) return c.body(null, 429);
    await next();
  });
  app.route("/t", telemetryRoutes(container));

  // Asılı istek bırakma: /v1/* 30 sn'de 504 (timeout HTTPException → errorHandler zarflar).
  // Webhook'lar hariç — yarıda kesilen ödeme işleme yerine sağlayıcının retry'ına güvenilir.
  app.use("/v1/*", timeout(30_000));
  app.use("/v1/*", authMiddleware(container.auth));
  // Moderasyon (ADR-104): banlı kullanıcı auth'tan sonra, kota harcamadan 403 alır.
  app.use("/v1/*", banGuard(container.moderation, container.logger));
  app.use("/v1/*", rateLimit(container.rateLimit.global, "global"));
  app.use("/v1/admin/*", adminMiddleware(container.admin));
  app.use(
    "/v1/watchers",
    onlyMethod("POST", rateLimit(container.rateLimit.createWatch, "watch_create")),
  );
  // Niyet asistanı LLM çağrısı yapar → ayrı, daha sıkı dakikalık sınır.
  app.use(
    "/v1/watchers/assist",
    onlyMethod("POST", rateLimit(container.rateLimit.assist, "assist")),
  );
  // Destek talebi açma da spam'e açık → aynı sıkı kovayla sınırlı (ayrı bucket).
  app.use("/v1/support", onlyMethod("POST", rateLimit(container.rateLimit.assist, "support")));

  app.route("/v1/me", meRoutes(container));
  app.route("/v1/plans", plansRoutes(container));
  app.route("/v1/watchers", watchersRoutes(container));
  app.route("/v1/feed", feedRoutes(container));
  app.route("/v1/announcements", announcementsRoutes(container));
  app.route("/v1/support", supportRoutes(container));
  app.route("/v1/events", eventsRoutes(container));
  app.route("/v1/devices", devicesRoutes(container));
  app.route("/v1/subscription", subscriptionRoutes(container));
  app.route("/v1/billing", billingRoutes(container));
  app.route("/v1/admin", adminRoutes(container));

  app.doc("/openapi.json", { openapi: "3.0.0", info: { title: "Watcher API", version: "0.0.0" } });
  app.notFound(notFoundHandler());
  app.onError(errorHandler(container.logger));

  return app;
}
