import type { CanonicalTopic } from "./topic";
import type { Watch } from "./watch";

/** Port'lar (Dependency Rule): domain arayüzleri; adapter'lar infrastructure'da implemente eder. */
export interface CanonicalTopicRepository {
  findByCanonicalQuery(canonicalQuery: string): Promise<CanonicalTopic | null>;
  /** Konu kaydı (lastCheckedAt dahil) — watcher listesinde "son kontrol" nabzı için. */
  getById(topicId: string): Promise<CanonicalTopic | null>;
  create(input: { canonicalQuery: string }): Promise<CanonicalTopic>;
  /** Konunun resmî kaynağı (ADR-046): resolved=false ise henüz çözülmedi. */
  getAuthority(topicId: string): Promise<{ domain: string | null; resolved: boolean }>;
  setAuthority(topicId: string, domain: string | null): Promise<void>;
}

export interface WatchRepository {
  create(input: Omit<Watch, "id">): Promise<Watch>;
  findById(watchId: string): Promise<Watch | null>;
  listByUser(userId: string): Promise<Watch[]>;
  update(
    watchId: string,
    patch: Partial<Pick<Watch, "frequencyMinutes" | "status" | "completedAt">>,
  ): Promise<Watch>;
  delete(watchId: string): Promise<void>;
}
