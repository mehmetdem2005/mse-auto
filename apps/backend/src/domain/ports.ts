import type { CanonicalTopic } from "./topic";
import type { Watch } from "./watch";

/** Port'lar (Dependency Rule): domain arayüzleri; adapter'lar infrastructure'da implemente eder. */
export interface CanonicalTopicRepository {
  findByCanonicalQuery(canonicalQuery: string): Promise<CanonicalTopic | null>;
  create(input: { canonicalQuery: string }): Promise<CanonicalTopic>;
}

export interface WatchRepository {
  create(input: Omit<Watch, "id">): Promise<Watch>;
  listByUser(userId: string): Promise<Watch[]>;
  update(
    watchId: string,
    patch: Partial<Pick<Watch, "frequencyMinutes" | "status">>,
  ): Promise<Watch>;
}
