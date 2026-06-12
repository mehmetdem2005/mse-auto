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
  /** "Sonar" derin tarama (ADR-089): kontrolde çok-turlu doğrulama zorlanır. */
  deepScan: boolean;
  /** Sonuç bulununca izleme otomatik durur (ADR-092; varsayılan açık). */
  stopAfterHit: boolean;
  /** Otomatik durdurma gerçekleştiyse zamanı (yoksa null). */
  completedAt: string | null;
}
