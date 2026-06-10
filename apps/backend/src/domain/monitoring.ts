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

/** Saklanan arama sonucu (kamusal web verisi; ADR-036). */
export interface StoredSearchHit {
  title: string;
  snippet: string;
  url: string;
  date: string | null;
}

export interface RecordCheckRunInput {
  topicId: string;
  resultSummary: string;
  reasoning: string;
  decision: boolean;
  confidence: number;
  searchQuery?: string | null;
  hits?: StoredSearchHit[] | null;
}

/** Kullanıcı/admin'in göreceği "araştırma" görünümleri (okuma). */
export interface CheckRunView {
  id: string;
  ranAt: string;
  decision: boolean;
  confidence: number | null;
  summary: string | null;
  reasoning: string | null;
  searchQuery: string | null;
  hits: StoredSearchHit[] | null;
}
export interface DetectionEventView {
  id: string;
  description: string;
  detectedAt: string;
  facts: EventFacts | null;
}

/** Birleşik aktivite akışı satırı (teslimat + olay + watcher). */
export interface FeedItemRow {
  deliveryId: string;
  watchId: string;
  watchIntent: string;
  eventId: string;
  description: string;
  detectedAt: string;
  facts: EventFacts | null;
  channel: string;
  status: string;
  readAt: string | null;
}

export type FeedbackVerdict = "correct" | "incorrect";

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
  // --- aktivite feed + geri bildirim (kullanıcı) ---
  listFeed(userId: string, limit: number): Promise<FeedItemRow[]>;
  recordFeedback(userId: string, eventId: string, verdict: FeedbackVerdict): Promise<void>;
  /** Tek teslimi okundu damgala (yalnız sahibinin satırı). */
  markDeliveryRead(userId: string, deliveryId: string): Promise<void>;
  /** Kullanıcının tüm okunmamışlarını okundu yap; etkilenen satır sayısı döner. */
  markAllRead(userId: string): Promise<number>;
}
