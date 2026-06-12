import { startWorkers } from "./application/start-workers";
import { createContainer } from "./config/container";
import { loadEnv } from "./config/env";
import { logger } from "./infrastructure/logging/logger";
import { installProcessGuards, shutdownGracefully } from "./process-lifecycle";

const env = loadEnv();
const container = createContainer(env);
const queueKind = env.DATABASE_URL ? "pg-boss" : "in-memory";

installProcessGuards(logger);

let workers: { stop: () => void } | null = null;

async function main(): Promise<void> {
  await container.queue.init();
  workers = await startWorkers(container);
  logger.info("worker_ready", { queue: queueKind, roles: "monitoring+delivery+scheduler" });
}

main().catch((err: unknown) => {
  const e = err instanceof Error ? err : new Error(String(err));
  logger.error("worker_boot_failed", { message: e.message, stack: e.stack });
  process.exit(1);
});

shutdownGracefully(logger, async () => {
  workers?.stop();
  await container.queue.shutdown();
});
