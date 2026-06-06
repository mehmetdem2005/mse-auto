/**
 * RAG over Supabase pgvector.
 *
 * Flow: knowledge chunk -> gemini-embedding-001 -> pgvector column -> cosine retrieval.
 * The scriptwriter pulls the top-k VERIFIED chunks so scripts are grounded in real,
 * fact-checked source material (not hallucinated). See supabase/schema.sql for the
 * `match_knowledge` SQL function this calls.
 */
import { embed } from "./gemini.js";
import { supabase } from "./supabase.js";
import type { KnowledgeChunk } from "./types.js";

/** Add (or update) a knowledge chunk: embeds it and upserts into pgvector. */
export async function ingest(chunk: Omit<KnowledgeChunk, "embedding">) {
  const [vec] = await embed([`${chunk.topic}\n\n${chunk.text}`]);
  const { error } = await supabase.from("knowledge").upsert({
    id: chunk.id,
    topic: chunk.topic,
    text: chunk.text,
    source_title: chunk.source_title,
    source_url: chunk.source_url,
    verified: chunk.verified,
    embedding: vec,
  });
  if (error) throw error;
}

/** Bulk-ingest the seed knowledge base. */
export async function ingestMany(chunks: Omit<KnowledgeChunk, "embedding">[]) {
  for (const c of chunks) await ingest(c);
}

/** Retrieve the top-k most relevant VERIFIED chunks for a query. */
export async function retrieve(query: string, k = 6): Promise<KnowledgeChunk[]> {
  const [qvec] = await embed([query]);
  const { data, error } = await supabase.rpc("match_knowledge", {
    query_embedding: qvec,
    match_count: k,
    only_verified: true,
  });
  if (error) throw error;
  return (data ?? []) as KnowledgeChunk[];
}

/**
 * Originality guard: returns the max cosine similarity between `text` and any recently
 * used script. Used by compliance.ts to refuse near-duplicate videos (YouTube's 2026
 * inauthentic-content policy nukes channels that repeat the same thing).
 */
export async function maxSimilarityToRecent(text: string): Promise<number> {
  const [vec] = await embed([text]);
  const { data, error } = await supabase.rpc("match_used_scripts", {
    query_embedding: vec,
    match_count: 1,
  });
  if (error) throw error;
  return data?.[0]?.similarity ?? 0;
}
