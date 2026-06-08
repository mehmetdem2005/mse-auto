import type { CanonicalTopicRepository } from "../../domain/ports";
import type { CanonicalTopic } from "../../domain/topic";
import { newId } from "../id";
import type { InMemoryStore } from "./store";

export class InMemoryCanonicalTopicRepository implements CanonicalTopicRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findByCanonicalQuery(canonicalQuery: string): Promise<CanonicalTopic | null> {
    const id = this.store.topicIdByQuery.get(canonicalQuery);
    return id ? (this.store.topics.get(id) ?? null) : null;
  }

  async create(input: { canonicalQuery: string }): Promise<CanonicalTopic> {
    const existingId = this.store.topicIdByQuery.get(input.canonicalQuery);
    const existing = existingId ? this.store.topics.get(existingId) : undefined;
    if (existing) return existing; // upsert semantiği (dedup)
    const topic: CanonicalTopic = {
      id: newId("topic"),
      canonicalQuery: input.canonicalQuery,
      lastCheckedAt: null,
    };
    this.store.topics.set(topic.id, topic);
    this.store.topicIdByQuery.set(topic.canonicalQuery, topic.id);
    return topic;
  }
}
