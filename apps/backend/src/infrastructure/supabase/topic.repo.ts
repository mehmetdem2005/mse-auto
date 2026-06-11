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

  async getById(topicId: string): Promise<CanonicalTopic | null> {
    const { data, error } = await this.db
      .from("canonical_topics")
      .select("*")
      .eq("id", topicId)
      .maybeSingle();
    if (error) throw new Error(`canonical_topics getById: ${error.message}`);
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

  async getAuthority(topicId: string): Promise<{ domain: string | null; resolved: boolean }> {
    const { data, error } = await this.db
      .from("canonical_topics")
      .select("authority_domain, authority_resolved")
      .eq("id", topicId)
      .maybeSingle();
    if (error) throw new Error(`topic authority get: ${error.message}`);
    return { domain: data?.authority_domain ?? null, resolved: data?.authority_resolved ?? false };
  }

  async setAuthority(topicId: string, domain: string | null): Promise<void> {
    const { error } = await this.db
      .from("canonical_topics")
      .update({ authority_domain: domain, authority_resolved: true })
      .eq("id", topicId);
    if (error) throw new Error(`topic authority set: ${error.message}`);
  }
}
