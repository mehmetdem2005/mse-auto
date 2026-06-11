import {
  EMPTY_USER_CHANNELS,
  type UserChannelRepository,
  type UserChannels,
} from "../../domain/channels";
import type { InMemoryStore } from "./store";

/** Bellek-içi ek-kanal tercihleri (ADR-084). */
export class InMemoryUserChannelRepository implements UserChannelRepository {
  constructor(private readonly store: InMemoryStore) {}

  async get(userId: string): Promise<UserChannels> {
    return this.store.userChannels.get(userId) ?? EMPTY_USER_CHANNELS;
  }

  async set(userId: string, channels: UserChannels): Promise<void> {
    this.store.userChannels.set(userId, channels);
  }
}
