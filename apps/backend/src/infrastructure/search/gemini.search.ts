import type { SearchHit, SearchProvider } from "../../domain/search";

interface GeminiGroundingChunk {
  web?: { uri?: string; title?: string };
}
interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    groundingMetadata?: { groundingChunks?: GeminiGroundingChunk[] };
  }>;
}

/**
 * Gemini + Google Search grounding ile gerçek web araması (PII'siz canonical sorgu).
 * Model hem arar hem özetler; özet + kaynaklar SearchHit'e map'lenir, kararı reasoner verir.
 */
export class GeminiSearchProvider implements SearchProvider {
  readonly name = "gemini";
  constructor(
    private readonly apiKey: string,
    private readonly model = "gemini-2.5-flash",
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async search(query: string): Promise<SearchHit[]> {
    const prompt = [
      `"${query}" konusunda EN GÜNCEL ve doğrulanmış web bilgilerini ara.`,
      "Olay gerçekleşti mi, ne zaman oldu, hangi resmî/güvenilir kaynak söylüyor — kısa ve olgusal yaz.",
      "Tahmin yürütme; yalnız bulduğun kaynaklara dayan.",
    ].join(" ");

    const res = await this.fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0 },
        }),
      },
    );
    if (!res.ok) throw new Error(`gemini ${res.status}`);
    const data = (await res.json()) as GeminiResponse;
    const cand = data.candidates?.[0];
    const text = (cand?.content?.parts ?? [])
      .map((p) => p.text ?? "")
      .join("")
      .trim();
    const chunks = cand?.groundingMetadata?.groundingChunks ?? [];

    const hits: SearchHit[] = [];
    if (text) {
      hits.push({ title: "Gemini arama özeti", snippet: text.slice(0, 800), url: "", date: null });
    }
    for (const c of chunks) {
      if (c.web?.uri) {
        hits.push({ title: c.web.title ?? "kaynak", snippet: "", url: c.web.uri, date: null });
      }
    }
    return hits;
  }
}
