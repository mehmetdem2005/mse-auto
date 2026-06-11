import { composeEventAlert } from "../domain/alert-text";
import type { AuthorityResolver } from "../domain/authority";
import type { Checker } from "../domain/checker";
import type { MonitoringRepository } from "../domain/monitoring";
import type { CanonicalTopicRepository } from "../domain/ports";
import type { JobQueue } from "../domain/queue";
import type { EventVerifier } from "../domain/verifier";
import { DELIVERY_QUEUE, type DeliveryJob } from "./delivery";
import { runTopicCheck } from "./run-topic-check";
import { CHECK_QUEUE, type TopicCheckJob } from "./scheduler";

export interface MonitoringWorkerDeps {
  queue: JobQueue;
  monitoring: MonitoringRepository;
  checker: Checker;
  verifier?: EventVerifier | undefined;
  topics?: CanonicalTopicRepository;
  authority?: AuthorityResolver;
}

/** Worker: check job'larını işler; tespit varsa teslim job'u kuyruğa alır. */
export async function registerMonitoringWorker(deps: MonitoringWorkerDeps): Promise<void> {
  await deps.queue.process<TopicCheckJob>(CHECK_QUEUE, async (job) => {
    const topic = {
      id: job.topicId,
      canonicalQuery: job.canonicalQuery,
      lastCheckedAt: job.lastCheckedAt,
    };
    const result = await runTopicCheck(
      {
        checker: deps.checker,
        monitoring: deps.monitoring,
        topics: deps.topics,
        authority: deps.authority,
        verifier: deps.verifier,
      },
      topic,
    );
    if (result.detected && result.eventId !== null && result.description !== null) {
      const alert = composeEventAlert({
        canonicalQuery: topic.canonicalQuery,
        description: result.description,
      });
      await deps.queue.enqueue<DeliveryJob>(DELIVERY_QUEUE, {
        eventId: result.eventId,
        title: alert.title,
        body: alert.body,
        facts: result.facts,
      });
    }
  });
}
