/** Domain modeli — Watcher (PII zon). ADR-010 arketipleri. */
export type WatchArchetype = "shared" | "personal";
export type WatchStatus = "active" | "paused";
/** Kaynak tercihi (ADR-050): aramanın öncelik sırasını belirler. */
export type WatchSourcePref = "auto" | "news" | "official" | "web";

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
  sourcePref: WatchSourcePref;
}
