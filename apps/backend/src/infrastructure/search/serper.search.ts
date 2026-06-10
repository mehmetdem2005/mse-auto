import type { SearchHit, SearchProvider } from "../../domain/search";

interface SerperOrganic {
  title?: string;
  link?: string;
  snippet?: string;
  date?: string;
}
interface SerperResponse {
  organic?: SerperOrganic[];
}

/** Serper.dev (primary) — POST google.serper.dev/search, X-API-KEY. */
export class SerperSearchProvider implements SearchProvider {
  readonly name = "serper";
  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async search(query: string): Promise<SearchHit[]> {
    // Güncellik (ADR-039): önce SON 1 HAFTA içinde ara (tbs=qdr:w);
    // hiç sonuç yoksa bağlam için filtresiz tekrar dene.
    const recent = await this.doSearch(query, "qdr:w");
    if (recent.length > 0) return recent;
    return this.doSearch(query, null);
  }

  private async doSearch(query: string, tbs: string | null): Promise<SearchHit[]> {
    const res = await this.fetchImpl("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": this.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, num: 10, gl: "tr", hl: "tr", ...(tbs ? { tbs } : {}) }),
    });
    if (!res.ok) throw new Error(`serper ${res.status}`);
    const data = (await res.json()) as SerperResponse;
    return (data.organic ?? []).map((o) => ({
      title: o.title ?? "",
      snippet: o.snippet ?? "",
      url: o.link ?? "",
      date: o.date ?? null,
    }));
  }
}
