/**
 * RAG bilgi tabanı portu (ADR-143 / M3.1). Embedding'ler DIŞARIDA üretilir (EmbeddingProvider,
 * ADR-127) — bu port yalnız saklar (`upsert`) ve benzerlik sorgular (`query`). Adapter: Supabase
 * pgvector (prod) · Null (DB yok / migration uygulanmadı → dormant, graceful).
 */

/** Gömülecek/saklanan belge: kaynak türü + kimliği + metin. */
export interface RagDocument {
  sourceType: string;
  sourceId: string;
  content: string;
}

/** Benzerlik isabeti — belge + cosine skoru (0..1; 1=birebir). */
export interface RagHit extends RagDocument {
  score: number;
}

export interface RagStore {
  /** Depo kullanılabilir mi (DB + migration var mı). false → çağıranlar RAG'i atlar (dormant). */
  readonly available: boolean;
  /** Embedding'li belgeleri ekle/güncelle (source_type+source_id çakışmasında değiştirir). */
  upsert(docs: (RagDocument & { embedding: number[] })[]): Promise<void>;
  /** Sorgu vektörüne en yakın top-K belge (opsiyonel kaynak-türü filtresi). */
  query(embedding: number[], topK: number, sourceTypes?: string[]): Promise<RagHit[]>;
}

/** number[] → pgvector metin gösterimi "[0.1,0.2,…]" (PostgREST insert + rpc için). */
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
