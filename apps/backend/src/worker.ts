import { registerDeliveryWorker } from "./application/delivery";
import { registerMonitoringWorker } from "./application/monitoring-worker";
import { runSchedulerTick } from "./application/scheduler";
import { createContainer } from "./config/container";
import { loadEnv } from "./config/env";

const env = loadEnv();
const container = createContainer(env);
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
  console.log(`✅ worker hazır (queue: ${queueKind}, monitoring + delivery)`);

  const tick = async (): Promise<void> => {
    const n = await runSchedulerTick({ queue: container.queue, monitoring: container.monitoring });
    if (n > 0) console.log(`scheduler: ${n} topic kuyruğa alındı`);
  };
  await tick();
  setInterval(() => void tick(), 60_000);
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
