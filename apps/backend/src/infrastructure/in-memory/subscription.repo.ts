import type { Subscription } from "../../domain/billing";
import type { SubscriptionRepository } from "../../domain/subscription";
import type { InMemoryStore } from "./store";

export class InMemorySubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly store: InMemoryStore) {}
  async getByUser(userId: string): Promise<Subscription | null> {
    return this.store.subscriptions.get(userId) ?? null;
  }
  async save(sub: Subscription): Promise<void> {
    this.store.subscriptions.set(sub.userId, sub);
  }
}
