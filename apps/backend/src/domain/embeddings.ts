/**
 * Gömme (embedding) sağlayıcı portu + katalog (ADR-127) — RAG bilgi tabanı için metni vektöre
 * çevirir. Sağlayıcılar admin-seçilebilir (LLM modeli gibi, ADR-095 deseni). TÜM modeller 768
 * boyuta normalize → pgvector kolonu sabit `vector(768)`, sağlayıcı değişimi boyut-uyumlu kalır.
 *
 * NOT (gerçek): Groq embedding SUNMAZ (yalnız sohbet/çıkarım). Gemini `text-embedding-004` Google
 * AI Studio ÜCRETSİZ kota ile gelir (varsayılan). OpenAI ucuz alternatif (dimensions=768).
 */
export type EmbeddingProviderId = "gemini" | "openai";

export const EMBEDDING_DIMENSIONS = 768;

export interface EmbeddingModelSpec {
  id: string;
  provider: EmbeddingProviderId;
  /** Sağlayıcıya giden gerçek model adı. */
  model: string;
  label: string;
  /** Dürüst not (maliyet/kota). */
  note: string;
  /** Çıktı vektör boyutu (tümü 768'e normalize). */
  dimensions: number;
}

export const EMBEDDING_CATALOG: readonly EmbeddingModelSpec[] = [
  {
    id: "gemini/text-embedding-004",
    provider: "gemini",
    model: "text-embedding-004",
    label: "Gemini text-embedding-004",
    note: "Google AI Studio — ÜCRETSİZ kota; 768 boyut.",
    dimensions: EMBEDDING_DIMENSIONS,
  },
  {
    id: "openai/text-embedding-3-small",
    provider: "openai",
    model: "text-embedding-3-small",
    label: "OpenAI text-embedding-3-small",
    note: "Ucuz/kaliteli; 768'e indirgenir (dimensions=768).",
    dimensions: EMBEDDING_DIMENSIONS,
  },
];

export function findEmbeddingModel(id: string): EmbeddingModelSpec | undefined {
  return EMBEDDING_CATALOG.find((m) => m.id === id);
}

/** Varsayılan: Gemini (ücretsiz) varsa onu, yoksa OpenAI; ikisi de yoksa null. */
export function defaultEmbeddingId(avail: Record<EmbeddingProviderId, boolean>): string | null {
  if (avail.gemini) return "gemini/text-embedding-004";
  if (avail.openai) return "openai/text-embedding-3-small";
  return null;
}

/** Metinleri vektöre çeviren sağlayıcı portu (infra implement eder). */
export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
}
