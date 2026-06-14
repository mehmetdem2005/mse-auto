import {
  type AiProfileRepository,
  EMPTY_AI_PROFILE,
  type UserAiProfile,
} from "../../domain/ai-profile";

/** Dev/in-memory AI kişiselleştirme deposu (ADR-113). */
export class InMemoryAiProfileRepository implements AiProfileRepository {
  private readonly map = new Map<string, UserAiProfile>();
  async get(userId: string): Promise<UserAiProfile> {
    return this.map.get(userId) ?? EMPTY_AI_PROFILE;
  }
  async set(userId: string, profile: UserAiProfile): Promise<void> {
    this.map.set(userId, { about: profile.about.trim(), attention: profile.attention.trim() });
  }
}
