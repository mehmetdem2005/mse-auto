import type { AuthUser, AuthVerifier } from "../../domain/auth";

/**
 * Dev/local — gerçek imza doğrulaması YAPMAZ. Bearer token'ı doğrudan
 * user id olarak alır (yerelde farklı kullanıcıları simüle etmek için).
 * Üretimde asla kullanılmaz (Supabase yapılandırılınca SupabaseJwtVerifier devreye girer).
 */
export class DevAuthVerifier implements AuthVerifier {
  async verify(token: string): Promise<AuthUser> {
    if (!token) throw new Error("dev auth: boş token");
    return { userId: token, email: null };
  }
}
