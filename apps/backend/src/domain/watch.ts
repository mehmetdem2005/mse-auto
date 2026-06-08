/** Domain modeli — Watcher (PII zon). ADR-010 arketipleri. */
export type WatchArchetype = "shared" | "personal";
export type WatchStatus = "active" | "paused";

export interface Watch {
  id: string;
  userId: string;
  /** Doğal dil; PII içerebilir → dış hatta ASLA gitmez (P1). */
  rawIntent: string;
  /** PII'siz paylaşılan topic'e referans. */
  canonicalTopicId: string;
  archetype: WatchArchetype;
  frequencyMinutes: number;
  status: WatchStatus;
  createdAt: string;
}
