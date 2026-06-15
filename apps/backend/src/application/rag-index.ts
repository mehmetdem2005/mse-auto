import type { EmbeddingProvider } from "../domain/embeddings";
import type { RagDocument, RagStore } from "../domain/rag";

/**
 * Belgeleri göm + RAG deposuna yaz (ADR-143 / M3.1 yazım yolu). Korpus kaynaklarını (detection_events
 * vb.) indeksleyen worker (M3.2) bunu çağırır. Depo dormant (DB/migration yok) ya da belge yoksa
 * graceful no-op (0 döner) — embedding üretilemeyenler atlanır. Saklanan belge sayısını döndürür.
 */
export async function indexDocuments(
  deps: { embedder: EmbeddingProvider; rag: RagStore },
  docs: RagDocument[],
): Promise<number> {
  if (!deps.rag.available || docs.length === 0) return 0;
  const vectors = await deps.embedder.embed(docs.map((d) => d.content));
  const records = docs
    .map((d, i) => ({ ...d, embedding: vectors[i] ?? [] }))
    .filter((r) => r.embedding.length > 0);
  await deps.rag.upsert(records);
  return records.length;
}
