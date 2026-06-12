import type { Container } from "../config/container";
import { registerDeliveryWorker } from "./delivery";
import { registerMonitoringWorker } from "./monitoring-worker";
import { runSchedulerTick } from "./scheduler";

export interface WorkersHandle {
  /** Scheduler döngüsünü durdurur (graceful shutdown). */
  stop: () => void;
}

/**
 * Monitoring + delivery worker'larını kaydeder ve scheduler tick döngüsünü başlatır.
 * worker.ts (ayrı süreç) ve main-combined.ts (tek süreç) ortak kullanır — tek kaynak.
 *
 * Tick hataları YUTULUR (loglanır): tek bir başarısız tick (örn. geçici DB hatası)
 * unhandled rejection ile tüm süreci düşürmesin — combined modda HTTP sunucusu da aynı süreçte.
 */
export async function startWorkers(
  container: Container,
  intervalMs = 60_000,
): Promise<WorkersHandle> {
  await registerMonitoringWorker({
    queue: container.queue,
    monitoring: container.monitoring,
    checker: container.checker,
    verifier: container.verifier,
    topics: container.topics,
    authority: container.authority,
    watches: container.watches,
    timeoutMs: container.checkTimeoutMs,
  });
  await registerDeliveryWorker({
    queue: container.queue,
    monitoring: container.monitoring,
    devices: container.devices,
    notifier: container.notifier,
    channels: container.channels,
    userChannels: container.userChannels,
  });

  const tick = async (): Promise<void> => {
    try {
      const n = await runSchedulerTick({
        queue: container.queue,
        monitoring: container.monitoring,
      });
      if (n > 0) container.logger.info("scheduler_enqueued", { topics: n });
    } catch (err) {
      container.logger.error("scheduler_tick_failed", {
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };
  await tick();
  const timer = setInterval(() => void tick(), intervalMs);
  return { stop: () => clearInterval(timer) };
}
