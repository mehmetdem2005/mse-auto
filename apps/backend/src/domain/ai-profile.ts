/** Kullanıcı-başına AI kişiselleştirme (ADR-113) — asistan istemine enjekte edilir. */
export interface UserAiProfile {
  /** Kullanıcının kendini tanıtması (bağlam). */
  about: string;
  /** Ek dikkat/odak notu. */
  attention: string;
}

export const EMPTY_AI_PROFILE: UserAiProfile = { about: "", attention: "" };

export interface AiProfileRepository {
  get(userId: string): Promise<UserAiProfile>;
  set(userId: string, profile: UserAiProfile): Promise<void>;
}

/**
 * Profili LLM sistem istemine eklenecek bağlam metnine çevirir; her ikisi de boşsa null
 * (enjeksiyon yok). PII yalnız bu kullanıcının kendi asistan çağrısına gider.
 */
export function aiProfileContext(p: UserAiProfile): string | null {
  const parts: string[] = [];
  if (p.about.trim()) parts.push(`User context (who they are): ${p.about.trim()}`);
  if (p.attention.trim()) parts.push(`Extra attention the user asked for: ${p.attention.trim()}`);
  return parts.length > 0 ? parts.join("\n") : null;
}
