import type { SupabaseClient } from "@supabase/supabase-js";
import type { TrafficEvent, TrafficRepository } from "../../domain/traffic";
import type { Database } from "./database.types";

type Row = Database["public"]["Tables"]["traffic_events"]["Row"];

function toDomain(r: Row): TrafficEvent {
  return {
    day: r.day,
    source: r.source,
    ref: r.ref,
    utm: r.utm,
    path: r.path,
    lang: r.lang,
    platform: r.platform,
  };
}

/** traffic_events: RLS açık + policy YOK → yalnız service-role yazar/okur (kimliksiz veri). */
export class SupabaseTrafficRepository implements TrafficRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async record(event: TrafficEvent): Promise<void> {
    const { error } = await this.db.from("traffic_events").insert({
      day: event.day,
      source: event.source,
      ref: event.ref,
      utm: event.utm,
      path: event.path,
      lang: event.lang,
      platform: event.platform,
    });
    // Migration 0013 henüz uygulanmadıysa graceful: telemetri kaybı kabul edilir, akış düşmez.
    if (error) throw new Error(`traffic insert: ${error.message}`);
  }

  async listSince(firstDay: string): Promise<TrafficEvent[]> {
    const { data, error } = await this.db
      .from("traffic_events")
      .select("day, source, ref, utm, path, lang, platform")
      .gte("day", firstDay)
      .limit(100_000);
    if (error) throw new Error(`traffic list: ${error.message}`);
    return (data ?? []).map((r) => toDomain(r as Row));
  }
}
