/** Web arama sonucu (PII'siz — canonical sorgu zaten PII'den arındırılmış). */
export interface SearchHit {
  title: string;
  snippet: string;
  url: string;
  date: string | null;
}

export interface SearchProvider {
  readonly name: string;
  search(query: string): Promise<SearchHit[]>;
  /** Tarihe duyarlı HABER araması (son 24 saat) — destekleyen sağlayıcılarda. */
  searchNews?(query: string): Promise<SearchHit[]>;
}
