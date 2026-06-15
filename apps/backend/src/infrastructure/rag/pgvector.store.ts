import type { SupabaseClient } from "@supabase/supabase-js";
import { type RagDocument, type RagHit, type RagStore, toVectorLiteral } from "../../domain/rag";
import type { Database } from "../supabase/database.types";

/**
 * Supabase pgvector RAG deposu (ADR-143 / M3.1). `embeddings` tablosu + `match_embeddings` RPC
 * (migration 0020). Vektörler PostgREST'e metin gösterimiyle ("[…]") gider. Migration uygulanmamışsa
 * upsert/query hata fırlatır → çağıran best-effort sarmalar (dormant; korpus indeksleme M3.2).
 */
export class SupabaseRagStore implements RagStore {
  readonly available = true;
  constructor(private readonly db: SupabaseClient<Database>) {}

  async upsert(docs: (RagDocument & { embedding: number[] })[]): Promise<void> {
    if (docs.length === 0) return;
    const rows = docs.map((d) => ({
      source_type: d.sourceType,
      source_id: d.sourceId,
      content: d.content,
      embedding: toVectorLiteral(d.embedding),
    }));
    const { error } = await this.db
      .from("embeddings")
      .upsert(rows, { onConflict: "source_type,source_id" });
    if (error) throw new Error(`rag upsert: ${error.message}`);
  }

  async query(embedding: number[], topK: number, sourceTypes?: string[]): Promise<RagHit[]> {
    const { data, error } = await this.db.rpc("match_embeddings", {
      query_embedding: toVectorLiteral(embedding),
      match_count: topK,
      filter_source_types: sourceTypes ?? null,
    });
    if (error) throw new Error(`rag query: ${error.message}`);
    return (data ?? []).map((r) => ({
      sourceType: r.source_type,
      sourceId: r.source_id,
      content: r.content,
      score: r.score,
    }));
  }
}
