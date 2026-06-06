/**
 * Long-term memory. Stores your preferences, performance insights the system learns from
 * analytics, and a ledger of already-used topics (so it never repeats a story).
 * Same pgvector approach as RAG, in a separate `memory` table.
 */
import { embed } from "./gemini.js";
import { supabase } from "./supabase.js";
import type { MemoryEntry } from "./types.js";

export async function remember(
  kind: MemoryEntry["kind"],
  content: string,
) {
  const [vec] = await embed([content]);
  const { error } = await supabase.from("memory").insert({
    kind,
    content,
    embedding: vec,
  });
  if (error) throw error;
}

export async function recall(query: string, k = 8): Promise<MemoryEntry[]> {
  const [qvec] = await embed([query]);
  const { data, error } = await supabase.rpc("match_memory", {
    query_embedding: qvec,
    match_count: k,
  });
  if (error) throw error;
  return (data ?? []) as MemoryEntry[];
}

/** Quick check: have we already covered this topic? */
export async function topicWasUsed(topic: string): Promise<boolean> {
  const { data } = await supabase
    .from("memory")
    .select("id")
    .eq("kind", "used_topic")
    .ilike("content", `%${topic}%`)
    .limit(1);
  return !!data?.length;
}
