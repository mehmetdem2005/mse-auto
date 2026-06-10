import type { CreateWatchInput, Watch as WatchDto } from "@watcher/contracts";
import { effectivePlan } from "../domain/billing";
import { canonicalize } from "../domain/canonicalize";
import { PlanLimitError } from "../domain/errors";
import { limitsFor } from "../domain/plan";
import type { CanonicalTopicRepository, WatchRepository } from "../domain/ports";
import type { JobQueue } from "../domain/queue";
import type { SubscriptionRepository } from "../domain/subscription";
import { CHECK_QUEUE, type TopicCheckJob } from "./scheduler";

export interface CreateWatcherDeps {
  watches: WatchRepository;
  topics: CanonicalTopicRepository;
  subscriptions: SubscriptionRepository;
  queue: JobQueue;
}

/** Plan limiti uygula → kanonikleştir → dedup → watch → DTO. */
export async function createWatcher(
  deps: CreateWatcherDeps,
  userId: string,
  input: CreateWatchInput,
): Promise<WatchDto> {
  const sub = await deps.subscriptions.getByUser(userId);
  const plan = effectivePlan(sub, new Date());
  const limits = limitsFor(plan);

  if (input.frequencyMinutes < limits.minFrequencyMinutes) {
    throw new PlanLimitError(
      "frequency_limit",
      `Bu planda (${plan}) en sık kontrol ${limits.minFrequencyMinutes} dakikadır; ${input.frequencyMinutes} dk seçilemez.`,
    );
  }
  const active = (await deps.watches.listByUser(userId)).filter((w) => w.status === "active");
  if (active.length >= limits.maxActiveWatches) {
    throw new PlanLimitError(
      "watch_limit",
      `Bu planda (${plan}) en fazla ${limits.maxActiveWatches} aktif watcher olabilir.`,
    );
  }

  const { canonicalQuery, archetype } = canonicalize(input.rawIntent);
  const existing = await deps.topics.findByCanonicalQuery(canonicalQuery);
  const topic = existing ?? (await deps.topics.create({ canonicalQuery }));

  // İlk arama hemen başlar (ADR-041): YENİ topic anında kuyruğa alınır —
  // kontrol şimdi koşar, markTopicChecked ile periyot bu andan sayılır.
  // Mevcut (paylaşılan) topic zaten rotasyondadır; çift kontrol üretme.
  if (!existing) {
    await deps.queue.enqueue<TopicCheckJob>(CHECK_QUEUE, {
      topicId: topic.id,
      canonicalQuery: topic.canonicalQuery,
      lastCheckedAt: topic.lastCheckedAt,
    });
  }

  const watch = await deps.watches.create({
    userId,
    rawIntent: input.rawIntent,
    canonicalTopicId: topic.id,
    archetype,
    frequencyMinutes: input.frequencyMinutes,
    status: "active",
    createdAt: new Date().toISOString(),
  });

  return {
    id: watch.id,
    rawIntent: watch.rawIntent,
    archetype: watch.archetype,
    frequencyMinutes: watch.frequencyMinutes,
    status: watch.status,
    createdAt: watch.createdAt,
  };
}
