import { EMBEDDING_DIMENSIONS, type EmbeddingProvider } from "../../domain/embeddings";

const TIMEOUT_MS = 20_000;

/**
 * OpenAI gömme adapteri (ADR-127). `text-embedding-3-small` + `dimensions=768` → Gemini ile
 * boyut-uyumlu (pgvector kolonu sabit kalır). Tek istekte toplu `input` dizisi destekler.
 */
export class OpenAiEmbeddings implements EmbeddingProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model = "text-embedding-3-small",
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await this.fetchImpl("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: this.model, input: texts, dimensions: EMBEDDING_DIMENSIONS }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`openai-embed ${res.status}`);
      const data = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
      const out = (data.data ?? []).map((e) => e.embedding ?? []);
      if (out.length !== texts.length) throw new Error("openai-embed eksik vektör");
      return out;
    } finally {
      clearTimeout(timer);
    }
  }
}
