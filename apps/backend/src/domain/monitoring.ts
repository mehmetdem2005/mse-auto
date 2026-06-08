import type { EventFacts } from "./personal";
import type { CanonicalTopic } from "./topic";
import type { WatchArchetype } from "./watch";

export interface Subscriber {
  userId: string;
  watchId: string;
  archetype: WatchArchetype;
}

export interface PendingDelivery {
  id: string;
  userId: string;
  watchId: string;
  archetype: WatchArchetype;
}

export type DeliveryStatus = "pending" | "sent" | "delivered" | "failed";

export interface RecordCheckRunInput {
  topicId: string;
  resultSummary: string;
  reasoning: string;
  decision: boolean;
  confidence: number;
}

/** İzleme/tespit + teslim kalıcılığı port'u (paylaşılan zon + fan-out). */
export interface MonitoringRepository {
  findTopicsDueForCheck(now: Date): Promise<CanonicalTopic[]>;
  markTopicChecked(topicId: string, at: string): Promise<void>;
  recordCheckRun(input: RecordCheckRunInput): Promise<{ id: string }>;
  recordDetectionEvent(input: {
    topicId: string;
    checkRunId: string;
    description: string;
    facts?: EventFacts | null;
  }): Promise<{ id: string }>;
  listActiveSubscribers(topicId: string): Promise<Subscriber[]>;
  createPendingDeliveries(eventId: string, subscribers: Subscriber[]): Promise<number>;
  // --- teslim (Faz 5) ---
  listPendingDeliveriesForEvent(eventId: string): Promise<PendingDelivery[]>;
  markDeliveryStatus(deliveryId: string, status: DeliveryStatus): Promise<void>;
}
