import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CheckRunView,
  DeliveryStatus,
  DetectionEventView,
  FeedItemRow,
  FeedbackVerdict,
  MonitoringRepository,
  PendingDelivery,
  RecordCheckRunInput,
  StoredSearchHit,
  Subscriber,
} from "../../domain/monitoring";
import type { EventFacts } from "../../domain/personal";
import type { CanonicalTopic } from "../../domain/topic";
import type { Database, Json } from "./database.types";

export class SupabaseMonitoringRepository implements MonitoringRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async findTopicsDueForCheck(now: Date): Promise<CanonicalTopic[]> {
    const { data, error } = await this.db.rpc("topics_due_for_check", { p_now: now.toISOString() });
    if (error) throw new Error(`topics_due_for_check: ${error.message}`);
    return (data ?? []).map((r) => ({
      id: r.id,
      canonicalQuery: r.canonical_query,
      lastCheckedAt: r.last_checked_at,
    }));
  }

  async markTopicChecked(topicId: string, at: string): Promise<void> {
    const { error } = await this.db
      .from("canonical_topics")
      .update({ last_checked_at: at, check_state: "idle" })
      .eq("id", topicId);
    if (error) throw new Error(`markTopicChecked: ${error.message}`);
  }

  async recordCheckRun(input: RecordCheckRunInput): Promise<{ id: string }> {
    const base = {
      topic_id: input.topicId,
      result_summary: input.resultSummary,
      reasoning: input.reasoning,
      decision: input.decision,
      confidence: input.confidence,
      search_query: input.searchQuery ?? null,
      // StoredSearchHit düz JSON-uyumlu nesnedir; jsonb kolonuna serbest tiple yazılır.
      search_hits: (input.hits as unknown as Json) ?? null,
    };
    let { data, error } = await this.db
      .from("check_runs")
      .insert({ ...base, tokens_used: input.tokensUsed ?? null })
      .select("id")
      .single();
    // Migration 0010 henüz uygulanmadıysa (tokens_used kolonu yok) tokens'sız dene —
    // deploy sıralaması canlıyı KIRMAZ; migration sonrası izler otomatik akar (ADR-077).
    if (error && /tokens_used/.test(error.message)) {
      ({ data, error } = await this.db.from("check_runs").insert(base).select("id").single());
    }
    if (error || !data) throw new Error(`recordCheckRun: ${error?.message ?? "boş"}`);
    return { id: data.id };
  }

  async recordDetectionEvent(input: {
    topicId: string;
    checkRunId: string;
    description: string;
    facts?: EventFacts | null;
  }): Promise<{ id: string }> {
    const { data, error } = await this.db
      .from("detection_events")
      .insert({
        topic_id: input.topicId,
        check_run_id: input.checkRunId,
        description: input.description,
        facts: input.facts ?? null,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(`recordDetectionEvent: ${error?.message ?? "boş"}`);
    return { id: data.id };
  }

  async listActiveSubscribers(topicId: string): Promise<Subscriber[]> {
    const { data, error } = await this.db
      .from("watches")
      .select("id, user_id, archetype, source_pref, deep_scan")
      .eq("canonical_topic_id", topicId)
      .eq("status", "active");
    if (error) throw new Error(`listActiveSubscribers: ${error.message}`);
    return (data ?? []).map((r) => ({
      userId: r.user_id,
      watchId: r.id,
      archetype: r.archetype,
      sourcePref: r.source_pref,
      deepScan: r.deep_scan,
    }));
  }

  async createPendingDeliveries(eventId: string, subscribers: Subscriber[]): Promise<number> {
    if (subscribers.length === 0) return 0;
    const rows = subscribers.map((s) => ({
      event_id: eventId,
      user_id: s.userId,
      watch_id: s.watchId,
      channel: "push",
      status: "pending",
    }));
    const { error } = await this.db.from("deliveries").insert(rows);
    if (error) throw new Error(`createPendingDeliveries: ${error.message}`);
    return subscribers.length;
  }

  async listPendingDeliveriesForEvent(eventId: string): Promise<PendingDelivery[]> {
    const { data, error } = await this.db
      .from("deliveries")
      .select("id, user_id, watch_id")
      .eq("event_id", eventId)
      .eq("status", "pending");
    if (error) throw new Error(`listPendingDeliveries: ${error.message}`);
    const rows = data ?? [];
    const watchIds = [...new Set(rows.map((r) => r.watch_id))];
    const archetypeOf = new Map<string, "shared" | "personal">();
    if (watchIds.length > 0) {
      const w = await this.db.from("watches").select("id, archetype").in("id", watchIds);
      if (w.error) throw new Error(`listPending archetypes: ${w.error.message}`);
      for (const row of w.data ?? []) archetypeOf.set(row.id, row.archetype);
    }
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      watchId: r.watch_id,
      archetype: archetypeOf.get(r.watch_id) ?? "shared",
    }));
  }

  async markDeliveryStatus(deliveryId: string, status: DeliveryStatus): Promise<void> {
    const sentAt = status === "sent" || status === "delivered" ? new Date().toISOString() : null;
    const { error } = await this.db
      .from("deliveries")
      .update({ status, sent_at: sentAt })
      .eq("id", deliveryId);
    if (error) throw new Error(`markDeliveryStatus: ${error.message}`);
  }

  async countCheckRunsSince(topicIds: string[], sinceIso: string): Promise<number> {
    if (topicIds.length === 0) return 0;
    const { count, error } = await this.db
      .from("check_runs")
      .select("*", { count: "exact", head: true })
      .in("topic_id", topicIds)
      .gte("ran_at", sinceIso);
    if (error) throw new Error(`countCheckRunsSince: ${error.message}`);
    return count ?? 0;
  }

  async listCheckRuns(topicId: string, limit: number): Promise<CheckRunView[]> {
    const { data, error } = await this.db
      .from("check_runs")
      .select("*")
      .eq("topic_id", topicId)
      .order("ran_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`listCheckRuns: ${error.message}`);
    return (data ?? []).map((r) => ({
      id: r.id,
      ranAt: r.ran_at,
      decision: r.decision,
      confidence: r.confidence,
      summary: r.result_summary,
      reasoning: r.reasoning,
      searchQuery: r.search_query,
      tokensUsed: r.tokens_used ?? null,
      hits: (r.search_hits as StoredSearchHit[] | null) ?? null,
    }));
  }

  async listDetectionEvents(topicId: string, limit: number): Promise<DetectionEventView[]> {
    const { data, error } = await this.db
      .from("detection_events")
      .select("id, description, detected_at, facts")
      .eq("topic_id", topicId)
      .order("detected_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`listDetectionEvents: ${error.message}`);
    return (data ?? []).map((e) => ({
      id: e.id,
      description: e.description,
      detectedAt: e.detected_at,
      facts: (e.facts as EventFacts | null) ?? null,
    }));
  }

  async listFeed(userId: string, limit: number): Promise<FeedItemRow[]> {
    const { data: dels, error } = await this.db
      .from("deliveries")
      .select("id, channel, status, sent_at, read_at, watch_id, event_id")
      .eq("user_id", userId)
      .order("sent_at", { ascending: false, nullsFirst: false })
      .limit(limit);
    if (error) throw new Error(`listFeed: ${error.message}`);
    const rows = dels ?? [];
    if (rows.length === 0) return [];

    const eventIds = [...new Set(rows.map((d) => d.event_id))];
    const watchIds = [...new Set(rows.map((d) => d.watch_id))];
    const [eventsRes, watchesRes] = await Promise.all([
      this.db
        .from("detection_events")
        .select("id, description, detected_at, facts, check_run_id")
        .in("id", eventIds),
      this.db.from("watches").select("id, raw_intent").in("id", watchIds),
    ]);
    if (eventsRes.error) throw new Error(`feed events: ${eventsRes.error.message}`);
    if (watchesRes.error) throw new Error(`feed watches: ${watchesRes.error.message}`);
    const eMap = new Map((eventsRes.data ?? []).map((e) => [e.id, e]));
    const wMap = new Map((watchesRes.data ?? []).map((w) => [w.id, w.raw_intent]));

    // "Neden bu bildirim" (ADR-086): olayların check_run'larından güveni topla.
    const runIds = [...new Set((eventsRes.data ?? []).map((e) => e.check_run_id).filter(Boolean))];
    const confMap = new Map<string, number | null>();
    if (runIds.length > 0) {
      const runsRes = await this.db.from("check_runs").select("id, confidence").in("id", runIds);
      if (runsRes.error) throw new Error(`feed runs: ${runsRes.error.message}`);
      for (const r of runsRes.data ?? []) confMap.set(r.id, r.confidence ?? null);
    }

    return rows.map((d) => {
      const e = eMap.get(d.event_id);
      return {
        deliveryId: d.id,
        watchId: d.watch_id,
        watchIntent: wMap.get(d.watch_id) ?? "",
        eventId: d.event_id,
        description: e?.description ?? "",
        detectedAt: e?.detected_at ?? d.sent_at ?? "",
        facts: (e?.facts as EventFacts | null) ?? null,
        confidence: e ? (confMap.get(e.check_run_id) ?? null) : null,
        channel: d.channel,
        status: d.status,
        readAt: d.read_at ?? null,
      };
    });
  }

  async recordFeedback(userId: string, eventId: string, verdict: FeedbackVerdict): Promise<void> {
    const { error } = await this.db
      .from("user_feedback")
      .insert({ user_id: userId, event_id: eventId, verdict });
    if (error) throw new Error(`recordFeedback: ${error.message}`);
  }

  async markDeliveryRead(userId: string, deliveryId: string): Promise<void> {
    const { error } = await this.db
      .from("deliveries")
      .update({ read_at: new Date().toISOString() })
      .eq("id", deliveryId)
      .eq("user_id", userId)
      .is("read_at", null);
    if (error) throw new Error(`markDeliveryRead: ${error.message}`);
  }

  async markAllRead(userId: string): Promise<number> {
    const { data, error } = await this.db
      .from("deliveries")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null)
      .select("id");
    if (error) throw new Error(`markAllRead: ${error.message}`);
    return (data ?? []).length;
  }
}
