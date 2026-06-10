/**
 * Resmî kaynak çözücü (ADR-046): bir izleme konusunun BİRİNCİL/RESMÎ kaynağı
 * olan kurum sitesini bulur (örn. ulusal sınav → ilgili kurumun alan adı).
 * Jenerik: konu adı/kurum adı hardcode edilmez; LLM her konu için çözer.
 */
export interface AuthorityInfo {
  /** Resmî sitenin alan adı (örn. "osym.gov.tr") — bilinmiyorsa null. */
  domain: string | null;
  /** Kurumun adı — bilinmiyorsa null. */
  name: string | null;
}

export interface AuthorityResolver {
  resolve(canonicalQuery: string): Promise<AuthorityInfo>;
}
