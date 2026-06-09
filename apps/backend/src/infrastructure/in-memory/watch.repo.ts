import type { WatchRepository } from "../../domain/ports";
import type { Watch } from "../../domain/watch";
import { newId } from "../id";
import type { InMemoryStore } from "./store";

export class InMemoryWatchRepository implements WatchRepository {
  constructor(private readonly store: InMemoryStore) {}

  async create(input: Omit<Watch, "id">): Promise<Watch> {
    const watch: Watch = { id: newId("watch"), ...input };
    this.store.watches.push(watch);
    return watch;
  }

  async findById(watchId: string): Promise<Watch | null> {
    return this.store.watches.find((w) => w.id === watchId) ?? null;
  }

  async listByUser(userId: string): Promise<Watch[]> {
    return this.store.watches.filter((w) => w.userId === userId);
  }

  async update(
    watchId: string,
    patch: Partial<Pick<Watch, "frequencyMinutes" | "status">>,
  ): Promise<Watch> {
    const w = this.store.watches.find((x) => x.id === watchId);
    if (!w) throw new Error(`watch yok: ${watchId}`);
    if (patch.frequencyMinutes !== undefined) w.frequencyMinutes = patch.frequencyMinutes;
    if (patch.status !== undefined) w.status = patch.status;
    return w;
  }
}
