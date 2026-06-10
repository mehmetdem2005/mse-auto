import type { SearchHit, SearchProvider } from "../../domain/search";

/** Sağlayıcıları sırayla dener; primary patlarsa fallback'e geçer. */
export class FallbackSearchProvider implements SearchProvider {
  readonly name = "fallback";
  constructor(private readonly providers: SearchProvider[]) {}

  async search(query: string): Promise<SearchHit[]> {
    let lastError: unknown;
    for (const provider of this.providers) {
      try {
        return await provider.search(query);
      } catch (err) {
        lastError = err;
      }
    }
    throw new Error(`tüm arama sağlayıcıları başarısız: ${String(lastError)}`);
  }

  /** Haber araması: destekleyen ilk sağlayıcıdan; hiçbiri desteklemiyorsa boş. */
  async searchNews(query: string): Promise<SearchHit[]> {
    let lastError: unknown;
    for (const provider of this.providers) {
      if (!provider.searchNews) continue;
      try {
        return await provider.searchNews(query);
      } catch (err) {
        lastError = err;
      }
    }
    if (lastError) throw new Error(`haber araması başarısız: ${String(lastError)}`);
    return [];
  }
}
