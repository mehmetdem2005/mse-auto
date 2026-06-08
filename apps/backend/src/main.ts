import { serve } from "@hono/node-server";
import { createContainer } from "./config/container";
import { loadEnv } from "./config/env";
import { createApp } from "./interfaces/http/app";

const env = loadEnv();
const container = createContainer(env);
const app = createApp(container);

const backend = env.SUPABASE_URL ? "supabase" : "in-memory";
serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(
    `✅ watcher-backend çalışıyor: http://localhost:${info.port} (${env.NODE_ENV}, repo: ${backend})`,
  );
});
