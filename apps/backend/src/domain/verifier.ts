import type { SearchHit } from "./search";

/**
 * Doğrulayıcı girdisi (ADR-060 A1) — generator-verifier deseni.
 * Üreticinin (reasoner) GEREKÇESİ kasıtlı olarak VERİLMEZ: doğrulayıcı, taze
 * bağlamla yalnız iddia + kaynaklara bakarak bağımsız karar verir (önyargısız).
 */
export interface VerifyInput {
  canonicalQuery: string; // PII'siz izlenen konu
  claim: string; // reasoner'ın "tespit" açıklaması (doğrulanacak iddia)
  hits: SearchHit[]; // reasoner'ın gördüğü kaynaklar
}

export interface VerifyResult {
  /** Kaynaklar iddiayı GERÇEKTEN, güncel ve doğrudan destekliyor mu? */
  confirmed: boolean;
  /** Kısa gerekçe (iz kaydına yazılır). */
  reason: string;
}

/**
 * Bağımsız doğrulayıcı port'u (ADR-060 A1) — yanlış-pozitif tespitleri öldürür.
 * Yalnız detected=true vakalarında çağrılır; reddederse kullanıcıya bildirim gitmez.
 */
export interface EventVerifier {
  verify(input: VerifyInput): Promise<VerifyResult>;
}
