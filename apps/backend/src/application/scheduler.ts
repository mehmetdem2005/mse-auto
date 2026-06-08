import type { MonitoringRepository } from "../domain/monitoring";
import type { JobQueue } from "../domain/queue";

export const CHECK_QUEUE = "topic-check";

export interface TopicCheckJob {
  topicId: string;
  canonicalQuery: string;
  lastCheckedAt: string | null;
}

export interface SchedulerDeps {
  queue: JobQueue;
  monitoring: MonitoringRepository;
}

/**
 * Kontrol zamanı gelen topic'leri kuyruğa alır (prod: Render Cron / interval tetikler).
 * "Due" = topic'in son kontrolü, ona bağlı aktif watch'ların min frequency'sinden eski.
 */
export async function runSchedulerTick(
  deps: SchedulerDeps,
  now: Date = new Date(),
): Promise<number> {
  const due = await deps.monitoring.findTopicsDueForCheck(now);
  for (const t of due) {
    await deps.queue.enqueue<TopicCheckJob>(CHECK_QUEUE, {
      topicId: t.id,
      canonicalQuery: t.canonicalQuery,
      lastCheckedAt: t.lastCheckedAt,
    });
  }
  return due.length;
}
