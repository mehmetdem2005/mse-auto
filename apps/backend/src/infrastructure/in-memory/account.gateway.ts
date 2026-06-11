import type { AccountGateway } from "../../domain/account";
import type { InMemoryStore } from "./store";

/** Dev/test: kullanıcı-kapsamlı dizileri yerinde temizler (paylaşılan topic/event'lere dokunmaz). */
export class InMemoryAccountGateway implements AccountGateway {
  constructor(private readonly store: InMemoryStore) {}

  async deleteAccount(userId: string): Promise<void> {
    const purge = <T>(arr: T[], keep: (x: T) => boolean): void => {
      for (let i = arr.length - 1; i >= 0; i--) {
        const item = arr[i];
        if (item !== undefined && !keep(item)) arr.splice(i, 1);
      }
    };
    purge(this.store.watches, (w) => w.userId !== userId);
    purge(this.store.deliveries, (d) => d.userId !== userId);
    purge(this.store.deviceTokens, (t) => t.userId !== userId);
    this.store.userChannels.delete(userId);
    this.store.subscriptions.delete(userId);
  }
}
