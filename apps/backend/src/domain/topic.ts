/** Domain modeli — CanonicalTopic (PII'siz paylaşılan zon, dedup birimi / P2). */
export interface CanonicalTopic {
  id: string;
  /** PII sıyrılmış kanonik sorgu — dış hatta giden tek şey (P1). */
  canonicalQuery: string;
  lastCheckedAt: string | null;
}
