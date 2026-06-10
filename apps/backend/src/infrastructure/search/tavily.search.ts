import type { SearchHit, SearchProvider } from "../../domain/search";

interface TavilyResult {
  title?: string;
  url?: string;
  content?: string;
}
interface TavilyResponse {
  results?: TavilyResult[];
}

/** Tavily (fallback) — POST api.tavily.com/search, Authorization: Bearer. */
export class TavilySearchProvider implements SearchProvider {
  readonly name = "tavily";
  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async search(query: string): Promise<SearchHit[]> {
    const res = await this.fetchImpl("https://api.tavily.com/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      // Güncellik (ADR-039): yalnız son 7 günün haberleri.
      body: JSON.stringify({
        query,
        max_results: 10,
        search_depth: "basic",
        topic: "news",
        days: 7,
      }),
    });
    if (!res.ok) throw new Error(`tavily ${res.status}`);
    const data = (await res.json()) as TavilyResponse;
    return (data.results ?? []).map((r) => ({
      title: r.title ?? "",
      snippet: r.content ?? "",
      url: r.url ?? "",
      date: null,
    }));
  }
}
