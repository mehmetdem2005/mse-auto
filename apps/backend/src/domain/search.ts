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
}
