import type {
  DeliveryStatus,
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
      .map((w) => ({ userId: w.userId, watchId: w.id, archetype: w.archetype }));
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
}
