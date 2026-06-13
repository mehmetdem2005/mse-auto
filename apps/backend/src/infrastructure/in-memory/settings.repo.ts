import type { SettingsRepository } from "../../domain/settings";

/** Dev/test ayar deposu — süreç belleği; her zaman "kalıcı" sayılır. */
export class InMemorySettingsRepository implements SettingsRepository {
  private readonly map = new Map<string, unknown>();

  async get(key: string): Promise<unknown | null> {
    return this.map.has(key) ? (this.map.get(key) as unknown) : null;
  }

  async set(key: string, value: unknown): Promise<boolean> {
    this.map.set(key, value);
    return true;
  }
}
