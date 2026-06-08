import { createRemoteJWKSet, jwtVerify } from "jose";
import type { AuthUser, AuthVerifier } from "../../domain/auth";

/** jose'un kabul ettiği anahtar/çözücü tipi (uzak JWKS veya yerel anahtar). */
type VerifyKey = Parameters<typeof jwtVerify>[1];

/**
 * Supabase erişim token'larını doğrular (ES256 + JWKS — güncel varsayılan).
 * Anahtar çözücü enjekte edilebilir (prod: uzak JWKS; test: yerel anahtar).
 */
export class SupabaseJwtVerifier implements AuthVerifier {
  private readonly keys: VerifyKey;
  private readonly issuer: string;

  constructor(supabaseUrl: string, keys?: VerifyKey) {
    this.issuer = `${supabaseUrl.replace(/\/$/, "")}/auth/v1`;
    this.keys = keys ?? createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`));
  }

  async verify(token: string): Promise<AuthUser> {
    const { payload } = await jwtVerify(token, this.keys, {
      issuer: this.issuer,
      audience: "authenticated",
    });
    if (typeof payload.sub !== "string") throw new Error("jwt: sub (user id) yok");
    const email = typeof payload.email === "string" ? payload.email : null;
    return { userId: payload.sub, email };
  }
}
