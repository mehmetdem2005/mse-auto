import type { SupabaseClient } from "@supabase/supabase-js";
import type { WatchRepository } from "../../domain/ports";
import type { Watch } from "../../domain/watch";
import type { Database } from "./database.types";

type WatchRow = Database["public"]["Tables"]["watches"]["Row"];

function toDomain(row: WatchRow): Watch {
  return {
    id: row.id,
    userId: row.user_id,
    rawIntent: row.raw_intent,
    canonicalTopicId: row.canonical_topic_id,
    archetype: row.archetype,
    frequencyMinutes: row.frequency_minutes,
    status: row.status,
    createdAt: row.created_at,
    sourcePref: row.source_pref,
    deepScan: row.deep_scan,
    // Migration 0013 öncesi satırlarda kolon olmayabilir → güvenli varsayılanlar.
    stopAfterHit: row.stop_after_hit ?? true,
    completedAt: row.completed_at ?? null,
  };
}

export class SupabaseWatchRepository implements WatchRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async create(input: Omit<Watch, "id">): Promise<Watch> {
    const { data, error } = await this.db
      .from("watches")
      .insert({
        user_id: input.userId,
        raw_intent: input.rawIntent,
        canonical_topic_id: input.canonicalTopicId,
        archetype: input.archetype,
        frequency_minutes: input.frequencyMinutes,
        status: input.status,
        created_at: input.createdAt,
        source_pref: input.sourcePref,
        deep_scan: input.deepScan,
        stop_after_hit: input.stopAfterHit,
        completed_at: input.completedAt,
      })
      .select("*")
      .single();
    if (error || !data) throw new Error(`watches insert: ${error?.message ?? "boş"}`);
    return toDomain(data);
  }

  async findById(watchId: string): Promise<Watch | null> {
    const { data, error } = await this.db
      .from("watches")
      .select("*")
      .eq("id", watchId)
      .maybeSingle();
    if (error) throw new Error(`watches findById: ${error.message}`);
    return data ? toDomain(data) : null;
  }

  async listByUser(userId: string): Promise<Watch[]> {
    const { data, error } = await this.db
      .from("watches")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(`watches list: ${error.message}`);
    return (data ?? []).map(toDomain);
  }

  async update(
    watchId: string,
    patch: Partial<Pick<Watch, "frequencyMinutes" | "status" | "completedAt">>,
  ): Promise<Watch> {
    const row: Database["public"]["Tables"]["watches"]["Update"] = {};
    if (patch.frequencyMinutes !== undefined) row.frequency_minutes = patch.frequencyMinutes;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.completedAt !== undefined) row.completed_at = patch.completedAt;
    const { data, error } = await this.db
      .from("watches")
      .update(row)
      .eq("id", watchId)
      .select("*")
      .single();
    if (error || !data) throw new Error(`watches update: ${error?.message ?? "boş"}`);
    return toDomain(data);
  }

  async delete(watchId: string): Promise<void> {
    const { error } = await this.db.from("watches").delete().eq("id", watchId);
    if (error) throw new Error(`watches delete: ${error.message}`);
  }
}
