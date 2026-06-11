import type {
  CheckRunView,
  DeliveryStatus,
  DetectionEventView,
  FeedItemRow,
  FeedbackVerdict,
  MonitoringRepository,
  PendingDelivery,
  RecordCheckRunInput,
  Subscriber,
} from "../../domain/monitoring";
import type { EventFacts } from "../../domain/personal";
import type { CanonicalTopic } from "../../domain/topic";
import { newId } from "../id";
import type { InMemoryStore } from "./store";

export class InMemoryMonitoringRepository implements MonitoringRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findTopicsDueForCheck(now: Date): Promise<CanonicalTopic[]> {
    const due: CanonicalTopic[] = [];
    for (const topic of this.store.topics.values()) {
      const active = this.store.watches.filter(
        (w) => w.canonicalTopicId === topic.id && w.status === "active",
      );
      if (active.length === 0) continue;
      const minFreq = Math.min(...active.map((w) => w.frequencyMinutes));
      if (topic.lastCheckedAt === null) {
        due.push(topic);
        continue;
      }
      const last = new Date(topic.lastCheckedAt).getTime();
      if (now.getTime() - last >= minFreq * 60_000) due.push(topic);
    }
    return due;
  }

  async markTopicChecked(topicId: string, at: string): Promise<void> {
    const t = this.store.topics.get(topicId);
    if (t) t.lastCheckedAt = at;
  }

  async recordCheckRun(input: RecordCheckRunInput): Promise<{ id: string }> {
    const id = newId("run");
    this.store.checkRuns.push({
      id,
      topicId: input.topicId,
      ranAt: new Date().toISOString(),
      resultSummary: input.resultSummary,
      reasoning: input.reasoning,
      decision: input.decision,
      confidence: input.confidence,
      searchQuery: input.searchQuery ?? null,
      hits: input.hits ?? null,
      tokensUsed: input.tokensUsed ?? null,
    });
    return { id };
  }

  async recordDetectionEvent(input: {
    topicId: string;
    checkRunId: string;
    description: string;
    facts?: EventFacts | null;
  }): Promise<{ id: string }> {
    const id = newId("event");
    this.store.events.push({
      id,
      topicId: input.topicId,
      checkRunId: input.checkRunId,
      description: input.description,
      facts: input.facts ?? null,
      detectedAt: new Date().toISOString(),
    });
    return { id };
  }

  async listActiveSubscribers(topicId: string): Promise<Subscriber[]> {
    return this.store.watches
      .filter((w) => w.canonicalTopicId === topicId && w.status === "active")
      .map((w) => ({
        userId: w.userId,
        watchId: w.id,
        archetype: w.archetype,
        sourcePref: w.sourcePref,
      }));
  }

  async createPendingDeliveries(eventId: string, subscribers: Subscriber[]): Promise<number> {
    for (const s of subscribers) {
      this.store.deliveries.push({
        id: newId("delivery"),
        eventId,
        userId: s.userId,
        watchId: s.watchId,
        channel: "push",
        status: "pending",
        readAt: null,
      });
    }
    return subscribers.length;
  }

  async listPendingDeliveriesForEvent(eventId: string): Promise<PendingDelivery[]> {
    return this.store.deliveries
      .filter((d) => d.eventId === eventId && d.status === "pending")
      .map((d) => ({
        id: d.id,
        userId: d.userId,
        watchId: d.watchId,
        archetype: this.store.watches.find((w) => w.id === d.watchId)?.archetype ?? "shared",
      }));
  }

  async markDeliveryStatus(deliveryId: string, status: DeliveryStatus): Promise<void> {
    const d = this.store.deliveries.find((x) => x.id === deliveryId);
    if (d) d.status = status;
  }

  async countCheckRunsSince(topicIds: string[], sinceIso: string): Promise<number> {
    const ids = new Set(topicIds);
    return this.store.checkRuns.filter((r) => ids.has(r.topicId) && r.ranAt >= sinceIso).length;
  }

  async listCheckRuns(topicId: string, limit: number): Promise<CheckRunView[]> {
    return this.store.checkRuns
      .filter((r) => r.topicId === topicId)
      .sort((a, b) => b.ranAt.localeCompare(a.ranAt))
      .slice(0, limit)
      .map((r) => ({
        id: r.id,
        ranAt: r.ranAt,
        decision: r.decision,
        confidence: r.confidence,
        summary: r.resultSummary,
        reasoning: r.reasoning,
        searchQuery: r.searchQuery,
        hits: r.hits,
        tokensUsed: r.tokensUsed ?? null,
      }));
  }

  async listDetectionEvents(topicId: string, limit: number): Promise<DetectionEventView[]> {
    return this.store.events
      .filter((e) => e.topicId === topicId)
      .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt))
      .slice(0, limit)
      .map((e) => ({
        id: e.id,
        description: e.description,
        detectedAt: e.detectedAt,
        facts: e.facts ?? null,
      }));
  }

  async listFeed(userId: string, limit: number): Promise<FeedItemRow[]> {
    return this.store.deliveries
      .filter((d) => d.userId === userId)
      .slice(-limit)
      .reverse()
      .map((d) => {
        const e = this.store.events.find((x) => x.id === d.eventId);
        const w = this.store.watches.find((x) => x.id === d.watchId);
        return {
          deliveryId: d.id,
          watchId: d.watchId,
          watchIntent: w?.rawIntent ?? "",
          eventId: d.eventId,
          description: e?.description ?? "",
          detectedAt: e?.detectedAt ?? "",
          facts: e?.facts ?? null,
          channel: d.channel,
          status: d.status,
          readAt: d.readAt,
        };
      });
  }

  async recordFeedback(
    _userId: string,
    _eventId: string,
    _verdict: FeedbackVerdict,
  ): Promise<void> {
    // Dev/in-memory: geri bildirim kalıcılığı yok (üretimde Supabase yazar).
  }

  async markDeliveryRead(userId: string, deliveryId: string): Promise<void> {
    const d = this.store.deliveries.find((x) => x.id === deliveryId && x.userId === userId);
    if (d && d.readAt === null) d.readAt = new Date().toISOString();
  }

  async markAllRead(userId: string): Promise<number> {
    const now = new Date().toISOString();
    let n = 0;
    for (const d of this.store.deliveries) {
      if (d.userId === userId && d.readAt === null) {
        d.readAt = now;
        n++;
      }
    }
    return n;
  }
}
