import type { Container } from "../config/container";
import { enabledKinds, getChannelAvailability } from "./channel-config";
import { registerDeliveryWorker } from "./delivery";
import { registerMonitoringWorker } from "./monitoring-worker";
import { indexNewDetectionEvents } from "./rag-corpus";
import { runSchedulerTick } from "./scheduler";

/** RAG korpus indeksleme aralığı (ADR-144) — scheduler'dan seyrek; gömme maliyeti batch'lenir. */
const RAG_INDEX_INTERVAL_MS = 5 * 60_000;

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
    enabledChannels: async () => enabledKinds(await getChannelAvailability(container.settings)),
    composeEmail: container.emailComposer
      ? (m) => container.emailComposer?.compose(m) ?? Promise.resolve(m)
      : undefined,
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

  // ADR-144 (M3.2) — RAG korpus indeksleme tick'i: yeni tespitleri göm + embeddings'e yaz (watermark'lı,
  // idempotent). RAG dormant (DB/gömme anahtarı yok) → no-op 0. Hatalar yutulur (tek tick süreci düşürmesin).
  const ragTick = async (): Promise<void> => {
    try {
      const n = await indexNewDetectionEvents({
        monitoring: container.monitoring,
        embedder: container.embedder,
        rag: container.rag,
        settings: container.settings,
      });
      if (n > 0) container.logger.info("rag_indexed", { events: n });
    } catch (err) {
      container.logger.error("rag_index_failed", {
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };
  void ragTick(); // boot'ta backlog'u başlat (bloklamadan)
  const ragTimer = setInterval(() => void ragTick(), RAG_INDEX_INTERVAL_MS);

  return {
    stop: () => {
      clearInterval(timer);
      clearInterval(ragTimer);
    },
  };
}
