import type { EmbeddingProvider } from "../../domain/embeddings";

const TIMEOUT_MS = 20_000;

/**
 * Google Generative Language API gömme adapteri (ADR-127). `text-embedding-004` natif 768 boyut;
 * Google AI Studio ÜCRETSİZ kota. `batchEmbedContents` ile toplu çağrı.
 */
export class GeminiEmbeddings implements EmbeddingProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model = "text-embedding-004",
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await this.fetchImpl(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:batchEmbedContents?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: texts.map((t) => ({
              model: `models/${this.model}`,
              content: { parts: [{ text: t }] },
            })),
          }),
          signal: ctrl.signal,
        },
      );
      if (!res.ok) throw new Error(`gemini-embed ${res.status}`);
      const data = (await res.json()) as { embeddings?: Array<{ values?: number[] }> };
      const out = (data.embeddings ?? []).map((e) => e.values ?? []);
      if (out.length !== texts.length) throw new Error("gemini-embed eksik vektör");
      return out;
    } finally {
      clearTimeout(timer);
    }
  }
}
