import type { Price, Subscription } from "../../domain/billing";
import type { StoredSearchHit } from "../../domain/monitoring";
import type { CanonicalTopic } from "../../domain/topic";
import type { Watch } from "../../domain/watch";

import type { EventFacts } from "../../domain/personal";

export interface StoredCheckRun {
  id: string;
  topicId: string;
  ranAt: string;
  resultSummary: string;
  reasoning: string;
  decision: boolean;
  confidence: number;
  searchQuery: string | null;
  hits: StoredSearchHit[] | null;
}
export interface StoredEvent {
  id: string;
  topicId: string;
  checkRunId: string;
  description: string;
  detectedAt: string;
  facts?: EventFacts | null;
}
export interface StoredDelivery {
  id: string;
  eventId: string;
  userId: string;
  watchId: string;
  channel: string;
  status: string;
  readAt: string | null;
}
export interface StoredDeviceToken {
  userId: string;
  token: string;
  platform: string;
}

/** Tüm in-memory adapter'ların paylaştığı tek durum (dev/test). */
export class InMemoryStore {
  readonly topics = new Map<string, CanonicalTopic>();
  readonly topicIdByQuery = new Map<string, string>();
  readonly watches: Watch[] = [];
  readonly checkRuns: StoredCheckRun[] = [];
  readonly events: StoredEvent[] = [];
  readonly deliveries: StoredDelivery[] = [];
  readonly deviceTokens: StoredDeviceToken[] = [];
  readonly subscriptions = new Map<string, Subscription>();
  // Dev varsayılan fiyat kataloğu (admin değiştirebilir). Prod'da admin/seed ayarlar.
  readonly prices: Price[] = [
    { plan: "pro", interval: "month", amountCents: 499, currency: "usd", active: true },
    { plan: "pro", interval: "year", amountCents: 4990, currency: "usd", active: true },
  ];
}
