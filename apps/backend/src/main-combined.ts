// Combined entry — HTTP sunucu + scheduler + worker'ları TEK process'te çalıştırır.
// Ücretsiz tek-servis (Render free) dağıtımı için: main.ts + worker.ts birleşimi.
// pg-boss kuyruğu aynı process içinde hem üretici hem tüketici olur (DATABASE_URL ile kalıcı).
import { serve } from "@hono/node-server";
import { registerDeliveryWorker } from "./application/delivery";
import { registerMonitoringWorker } from "./application/monitoring-worker";
import { runSchedulerTick } from "./application/scheduler";
import { createContainer } from "./config/container";
import { loadEnv } from "./config/env";
import { createApp } from "./interfaces/http/app";

const env = loadEnv();
const container = createContainer(env);
const app = createApp(container);

const backend = env.SUPABASE_URL ? "supabase" : "in-memory";
const queueKind = env.DATABASE_URL ? "pg-boss" : "in-memory";

async function main(): Promise<void> {
  await container.queue.init();
  await registerMonitoringWorker({
    queue: container.queue,
    monitoring: container.monitoring,
    checker: container.checker,
  });
  await registerDeliveryWorker({
    queue: container.queue,
    monitoring: container.monitoring,
    devices: container.devices,
    notifier: container.notifier,
  });

  const tick = async (): Promise<void> => {
    const n = await runSchedulerTick({ queue: container.queue, monitoring: container.monitoring });
    if (n > 0) console.log(`scheduler: ${n} topic kuyruğa alındı`);
  };
  await tick();
  setInterval(() => void tick(), 60_000);

  serve({ fetch: app.fetch, port: env.PORT }, (info) => {
    console.log(
      `✅ watcher-backend (combined) http://localhost:${info.port} | ${env.NODE_ENV} | repo:${backend} | queue:${queueKind} + monitoring + delivery + scheduler`,
    );
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

const shutdown = (): void => {
  void container.queue.shutdown().then(() => process.exit(0));
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
