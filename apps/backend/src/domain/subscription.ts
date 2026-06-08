import type { Subscription } from "./billing";

export interface SubscriptionRepository {
  getByUser(userId: string): Promise<Subscription | null>;
  save(sub: Subscription): Promise<void>;
}
