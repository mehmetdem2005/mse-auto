import type { CheckOutcome, Checker } from "../domain/checker";
import type { MonitoringRepository } from "../domain/monitoring";
import type { EventFacts } from "../domain/personal";
import type { CanonicalTopic } from "../domain/topic";

export interface RunTopicCheckDeps {
  checker: Checker;
  monitoring: MonitoringRepository;
}

export interface RunTopicCheckResult {
  detected: boolean;
  eventId: string | null;
  description: string | null;
  deliveries: number;
  facts: EventFacts | null;
}

/**
 * Bir topic'i kontrol eder: arama+muhakeme → CheckRun → tespit varsa
 * DetectionEvent + abonelere fan-out (pending Delivery). PII paylaşılan hatta girmez.
 */
export async function runTopicCheck(
  deps: RunTopicCheckDeps,
  topic: CanonicalTopic,
): Promise<RunTopicCheckResult> {
  let outcome: CheckOutcome;
  try {
    outcome = await deps.checker.check(topic);
  } catch (err) {
    // Checker hatası (örn. arama/LLM kotası): topic'i sonsuz "due" döngüsünde
    // bırakmamak için başarısız bir CheckRun kaydet + checked işaretle.
    await deps.monitoring.recordCheckRun({
      topicId: topic.id,
      resultSummary: "checker hatası",
      reasoning: err instanceof Error ? err.message : "bilinmeyen hata",
      decision: false,
      confidence: 0,
      searchQuery: topic.canonicalQuery,
      hits: null,
    });
    await deps.monitoring.markTopicChecked(topic.id, new Date().toISOString());
    return { detected: false, eventId: null, description: null, deliveries: 0, facts: null };
  }

  const run = await deps.monitoring.recordCheckRun({
    topicId: topic.id,
    resultSummary: outcome.resultSummary,
    reasoning: outcome.reasoning,
    decision: outcome.detected,
    confidence: outcome.confidence,
    searchQuery: outcome.searchQuery ?? topic.canonicalQuery,
    hits: outcome.hits ?? null,
  });
  await deps.monitoring.markTopicChecked(topic.id, new Date().toISOString());

  if (!outcome.detected || outcome.description === null) {
    return { detected: false, eventId: null, description: null, deliveries: 0, facts: null };
  }

  const event = await deps.monitoring.recordDetectionEvent({
    topicId: topic.id,
    checkRunId: run.id,
    description: outcome.description,
    facts: outcome.facts ?? null,
  });
  const subscribers = await deps.monitoring.listActiveSubscribers(topic.id);
  const deliveries = await deps.monitoring.createPendingDeliveries(event.id, subscribers);
  return {
    detected: true,
    eventId: event.id,
    description: outcome.description,
    deliveries,
    facts: outcome.facts ?? null,
  };
}
