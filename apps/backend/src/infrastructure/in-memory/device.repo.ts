import type { DeviceRepository } from "../../domain/device";
import type { InMemoryStore } from "./store";

export class InMemoryDeviceRepository implements DeviceRepository {
  constructor(private readonly store: InMemoryStore) {}

  async save(input: { userId: string; token: string; platform: string }): Promise<void> {
    const exists = this.store.deviceTokens.some(
      (d) => d.userId === input.userId && d.token === input.token,
    );
    if (!exists) this.store.deviceTokens.push({ ...input });
  }

  async listTokens(userId: string): Promise<string[]> {
    return this.store.deviceTokens.filter((d) => d.userId === userId).map((d) => d.token);
  }
}
