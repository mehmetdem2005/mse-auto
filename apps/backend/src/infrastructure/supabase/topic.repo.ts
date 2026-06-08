import type { SupabaseClient } from "@supabase/supabase-js";
import type { CanonicalTopicRepository } from "../../domain/ports";
import type { CanonicalTopic } from "../../domain/topic";
import type { Database } from "./database.types";

type TopicRow = Database["public"]["Tables"]["canonical_topics"]["Row"];

function toDomain(row: TopicRow): CanonicalTopic {
  return { id: row.id, canonicalQuery: row.canonical_query, lastCheckedAt: row.last_checked_at };
}

export class SupabaseCanonicalTopicRepository implements CanonicalTopicRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async findByCanonicalQuery(canonicalQuery: string): Promise<CanonicalTopic | null> {
    const { data, error } = await this.db
      .from("canonical_topics")
      .select("*")
      .eq("canonical_query", canonicalQuery)
      .maybeSingle();
    if (error) throw new Error(`canonical_topics find: ${error.message}`);
    return data ? toDomain(data) : null;
  }

  /** Upsert (unique canonical_query) → dedup yarışına karşı DB seviyesinde güvenli. */
  async create(input: { canonicalQuery: string }): Promise<CanonicalTopic> {
    const { data, error } = await this.db
      .from("canonical_topics")
      .upsert({ canonical_query: input.canonicalQuery }, { onConflict: "canonical_query" })
      .select("*")
      .single();
    if (error || !data) throw new Error(`canonical_topics upsert: ${error?.message ?? "boş"}`);
    return toDomain(data);
  }
}
