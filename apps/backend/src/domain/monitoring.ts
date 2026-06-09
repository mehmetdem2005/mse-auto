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

/** Kullanıcı/admin'in göreceği "araştırma" görünümleri (okuma). */
export interface CheckRunView {
  id: string;
  ranAt: string;
  decision: boolean;
  confidence: number | null;
  summary: string | null;
  reasoning: string | null;
}
export interface DetectionEventView {
  id: string;
  description: string;
  detectedAt: string;
  facts: EventFacts | null;
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
  // --- araştırma okuma (kullanıcı/admin) ---
  listCheckRuns(topicId: string, limit: number): Promise<CheckRunView[]>;
  listDetectionEvents(topicId: string, limit: number): Promise<DetectionEventView[]>;
}
