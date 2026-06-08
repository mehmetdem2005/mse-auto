import { startWorkers } from "./application/start-workers";
import { createContainer } from "./config/container";
import { loadEnv } from "./config/env";

const env = loadEnv();
const container = createContainer(env);
const queueKind = env.DATABASE_URL ? "pg-boss" : "in-memory";

let workers: { stop: () => void } | null = null;

async function main(): Promise<void> {
  await container.queue.init();
  workers = await startWorkers(container);
  console.log(`✅ worker hazır (queue: ${queueKind}, monitoring + delivery + scheduler)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

const shutdown = (): void => {
  workers?.stop();
  void container.queue.shutdown().then(() => process.exit(0));
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
