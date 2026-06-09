import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CheckRunView,
  DeliveryStatus,
  DetectionEventView,
  MonitoringRepository,
  PendingDelivery,
  RecordCheckRunInput,
  Subscriber,
} from "../../domain/monitoring";
import type { EventFacts } from "../../domain/personal";
import type { CanonicalTopic } from "../../domain/topic";
import type { Database } from "./database.types";

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
    const { data, error } = await this.db
      .from("check_runs")
      .insert({
        topic_id: input.topicId,
        result_summary: input.resultSummary,
        reasoning: input.reasoning,
        decision: input.decision,
        confidence: input.confidence,
      })
      .select("id")
      .single();
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
      .select("id, user_id, archetype")
      .eq("canonical_topic_id", topicId)
      .eq("status", "active");
    if (error) throw new Error(`listActiveSubscribers: ${error.message}`);
    return (data ?? []).map((r) => ({ userId: r.user_id, watchId: r.id, archetype: r.archetype }));
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

  async listCheckRuns(topicId: string, limit: number): Promise<CheckRunView[]> {
    const { data, error } = await this.db
      .from("check_runs")
      .select("id, ran_at, decision, confidence, result_summary, reasoning")
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
}
