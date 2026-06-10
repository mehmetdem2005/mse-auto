import type { AuthorityResolver } from "../domain/authority";
import type { CheckOutcome, Checker } from "../domain/checker";
import type { MonitoringRepository } from "../domain/monitoring";
import type { EventFacts } from "../domain/personal";
import type { CanonicalTopicRepository } from "../domain/ports";
import type { CanonicalTopic } from "../domain/topic";

export interface RunTopicCheckDeps {
  checker: Checker;
  monitoring: MonitoringRepository;
  /** Resmî kaynak çözümü (ADR-046) — opsiyonel: yoksa genel arama sürer. */
  topics?: CanonicalTopicRepository | undefined;
  authority?: AuthorityResolver | undefined;
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
  // Tekrar-bildirim bastırma (ADR-037): son bildirilen olayı checker'a ver;
  // muhakeme yalnız BUNDAN YENİ bir gelişmeyi tespit sayar.
  const lastEvents = await deps.monitoring.listDetectionEvents(topic.id, 1);
  const lastEventDescription = lastEvents[0]?.description ?? null;

  // Resmî kaynak (ADR-046): konu başına BİR KEZ çözülür, cache'lenir.
  let authorityDomain: string | null = null;
  if (deps.topics) {
    try {
      const auth = await deps.topics.getAuthority(topic.id);
      if (auth.resolved) {
        authorityDomain = auth.domain;
      } else if (deps.authority) {
        const info = await deps.authority.resolve(topic.canonicalQuery);
        authorityDomain = info.domain;
        await deps.topics.setAuthority(topic.id, info.domain);
      }
    } catch {
      // Çözüm hatası kontrolü düşürmez; bir sonraki koşuda yeniden denenir.
      authorityDomain = null;
    }
  }

  // Kaynak tercihi (ADR-050): konunun aktif abonelerinin çoğunluk tercihi
  // ('auto' sayılmaz) arama sırasını belirler.
  let sourcePref: "news" | "official" | "web" | null = null;
  try {
    const subs = await deps.monitoring.listActiveSubscribers(topic.id);
    const counts = new Map<string, number>();
    for (const sub of subs) {
      if (sub.sourcePref !== "auto") {
        counts.set(sub.sourcePref, (counts.get(sub.sourcePref) ?? 0) + 1);
      }
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    sourcePref = (top?.[0] as "news" | "official" | "web") ?? null;
  } catch {
    sourcePref = null;
  }

  let outcome: CheckOutcome;
  try {
    outcome = await deps.checker.check(topic, {
      lastEventDescription,
      authorityDomain,
      sourcePref,
    });
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
