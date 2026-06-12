import { serve } from "@hono/node-server";
import { createContainer } from "./config/container";
import { loadEnv } from "./config/env";
import { logger } from "./infrastructure/logging/logger";
import { createApp } from "./interfaces/http/app";
import { installProcessGuards, shutdownGracefully } from "./process-lifecycle";

const env = loadEnv();
const container = createContainer(env);
const app = createApp(container, env.CORS_ORIGINS);

installProcessGuards(logger);

const backend = env.SUPABASE_URL ? "supabase" : "in-memory";
const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info("http_ready", { port: info.port, env: env.NODE_ENV, repo: backend });
});

shutdownGracefully(logger, async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
