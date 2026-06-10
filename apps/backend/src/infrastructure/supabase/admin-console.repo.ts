import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdminConsoleRepository,
  AdminSubscriptionRow,
  AdminSystemInfo,
  AdminTimeseriesData,
  AdminUserRow,
  AdminWatchRow,
  BillingInterval,
} from "../../domain/billing";
import { addInterval } from "../../domain/billing";
import { dayKey, emptyBuckets, finalizeTimeseries, sinceIso } from "../shared/timeseries.util";
import type { Database } from "./database.types";

/** Admin paneli yönetim sorguları — service-role client ile (RLS bypass). */
export class SupabaseAdminConsoleRepository implements AdminConsoleRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  /** Kaynak doğruluk: auth.users (profiles tablosu trigger'sız boş kalabiliyor). */
  private async authUserList(): Promise<{ id: string; email: string | null; createdAt: string }[]> {
    const out: { id: string; email: string | null; createdAt: string }[] = [];
    const perPage = 1000;
    for (let page = 1; page <= 50; page++) {
      const { data, error } = await this.db.auth.admin.listUsers({ page, perPage });
      if (error) throw new Error(`auth users: ${error.message}`);
      const users = data.users ?? [];
      for (const u of users) {
        out.push({
          id: u.id,
          email: u.email ?? null,
          createdAt: u.created_at ?? new Date().toISOString(),
        });
      }
      if (users.length < perPage) break;
    }
    return out;
  }

  private async emailMap(): Promise<Map<string, string | null>> {
    const users = await this.authUserList();
    return new Map(users.map((u) => [u.id, u.email]));
  }

  /** Aktif (dönemi geçmemiş) abonelikleri olan kullanıcı id kümesi. */
  private async activeProUserIds(): Promise<Set<string>> {
    const nowIso = new Date().toISOString();
    const { data, error } = await this.db
      .from("subscriptions")
      .select("user_id")
      .eq("status", "active")
      .gt("current_period_end", nowIso);
    if (error) throw new Error(`active subs: ${error.message}`);
    return new Set((data ?? []).map((r) => r.user_id));
  }

  async listUsers(): Promise<AdminUserRow[]> {
    const [users, adminsRes, watchesRes, proIds] = await Promise.all([
      this.authUserList(),
      this.db.from("admins").select("user_id"),
      this.db.from("watches").select("user_id"),
      this.activeProUserIds(),
    ]);
    if (adminsRes.error) throw new Error(`admins: ${adminsRes.error.message}`);
    if (watchesRes.error) throw new Error(`watch counts: ${watchesRes.error.message}`);

    const adminSet = new Set((adminsRes.data ?? []).map((a) => a.user_id));
    const watchCounts = new Map<string, number>();
    for (const w of watchesRes.data ?? []) {
      watchCounts.set(w.user_id, (watchCounts.get(w.user_id) ?? 0) + 1);
    }

    return users
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((u) => ({
        id: u.id,
        email: u.email,
        createdAt: u.createdAt,
        isAdmin: adminSet.has(u.id),
        plan: proIds.has(u.id) ? "pro" : "free",
        watchCount: watchCounts.get(u.id) ?? 0,
      }));
  }

  async setAdmin(userId: string, makeAdmin: boolean): Promise<void> {
    if (makeAdmin) {
      const { error } = await this.db
        .from("admins")
        .upsert({ user_id: userId }, { onConflict: "user_id" });
      if (error) throw new Error(`admin ekle: ${error.message}`);
    } else {
      const { error } = await this.db.from("admins").delete().eq("user_id", userId);
      if (error) throw new Error(`admin kaldır: ${error.message}`);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    // Auth kullanıcısı silinince tüm PII tabloları ON DELETE CASCADE ile temizlenir.
    const { error } = await this.db.auth.admin.deleteUser(userId);
    if (error) throw new Error(`kullanıcı sil: ${error.message}`);
  }

  async listWatches(): Promise<AdminWatchRow[]> {
    const [{ data, error }, emails] = await Promise.all([
      this.db
        .from("watches")
        .select("id, user_id, raw_intent, archetype, frequency_minutes, status, created_at")
        .order("created_at", { ascending: false }),
      this.emailMap(),
    ]);
    if (error) throw new Error(`watch list: ${error.message}`);
    return (data ?? []).map((w) => ({
      id: w.id,
      userId: w.user_id,
      userEmail: emails.get(w.user_id) ?? null,
      rawIntent: w.raw_intent,
      archetype: w.archetype,
      frequencyMinutes: w.frequency_minutes,
      status: w.status,
      createdAt: w.created_at,
    }));
  }

  async setWatchStatus(watchId: string, status: "active" | "paused"): Promise<void> {
    const { error } = await this.db.from("watches").update({ status }).eq("id", watchId);
    if (error) throw new Error(`watch durum: ${error.message}`);
  }

  async deleteWatch(watchId: string): Promise<void> {
    const { error } = await this.db.from("watches").delete().eq("id", watchId);
    if (error) throw new Error(`watch sil: ${error.message}`);
  }

  async listSubscriptions(): Promise<AdminSubscriptionRow[]> {
    const [{ data, error }, emails] = await Promise.all([
      this.db
        .from("subscriptions")
        .select(
          "user_id, plan, status, billing_interval, amount_cents, currency, current_period_end, cancel_at_period_end",
        )
        .order("updated_at", { ascending: false }),
      this.emailMap(),
    ]);
    if (error) throw new Error(`sub list: ${error.message}`);
    return (data ?? []).map((s) => ({
      userId: s.user_id,
      userEmail: emails.get(s.user_id) ?? null,
      plan: s.plan,
      interval: s.billing_interval,
      amountCents: s.amount_cents,
      currency: s.currency,
      status: s.status,
      currentPeriodEnd: s.current_period_end,
      cancelAtPeriodEnd: s.cancel_at_period_end,
    }));
  }

  async giftPro(userId: string, interval: BillingInterval): Promise<void> {
    const now = new Date();
    const { error } = await this.db.from("subscriptions").upsert(
      {
        user_id: userId,
        plan: "pro",
        billing_interval: interval,
        amount_cents: 0,
        currency: "usd",
        current_period_start: now.toISOString(),
        current_period_end: addInterval(now, interval).toISOString(),
        status: "active",
        cancel_at_period_end: false,
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(`pro hediye: ${error.message}`);
  }

  async cancelSubscription(userId: string): Promise<void> {
    const { error } = await this.db
      .from("subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    if (error) throw new Error(`abonelik iptal: ${error.message}`);
  }

  async getSystem(): Promise<AdminSystemInfo> {
    const nowIso = new Date().toISOString();
    const head = { count: "exact" as const, head: true };
    const [userList, watches, activeWatches, subs, deliveries, checkRuns, recentRuns, recentDel] =
      await Promise.all([
        this.authUserList(),
        this.db.from("watches").select("*", head),
        this.db.from("watches").select("*", head).eq("status", "active"),
        this.db.from("subscriptions").select("*", head).eq("status", "active"),
        this.db.from("deliveries").select("*", head),
        this.db.from("check_runs").select("*", head),
        this.db
          .from("check_runs")
          .select("id, topic_id, ran_at, decision, confidence, result_summary")
          .order("ran_at", { ascending: false })
          .limit(10),
        this.db
          .from("deliveries")
          .select("id, status, channel, sent_at")
          .order("sent_at", { ascending: false, nullsFirst: false })
          .limit(10),
      ]);

    return {
      now: nowIso,
      backend: "supabase",
      counts: {
        users: userList.length,
        watches: watches.count ?? 0,
        activeWatches: activeWatches.count ?? 0,
        subscriptions: subs.count ?? 0,
        deliveries: deliveries.count ?? 0,
        checkRuns: checkRuns.count ?? 0,
      },
      recentCheckRuns: (recentRuns.data ?? []).map((r) => ({
        id: r.id,
        topicId: r.topic_id,
        ranAt: r.ran_at,
        decision: r.decision,
        confidence: r.confidence,
        summary: r.result_summary,
      })),
      recentDeliveries: (recentDel.data ?? []).map((d) => ({
        id: d.id,
        status: d.status,
        channel: d.channel,
        sentAt: d.sent_at,
      })),
    };
  }

  async getTimeseries(days: number): Promise<AdminTimeseriesData> {
    const since = sinceIso(days);
    const buckets = emptyBuckets(days);
    const [runs, dels] = await Promise.all([
      this.db.from("check_runs").select("ran_at, decision").gte("ran_at", since),
      this.db.from("deliveries").select("sent_at").gte("sent_at", since),
    ]);
    if (runs.error) throw new Error(`timeseries check_runs: ${runs.error.message}`);
    if (dels.error) throw new Error(`timeseries deliveries: ${dels.error.message}`);

    for (const r of runs.data ?? []) {
      const b = buckets.get(dayKey(r.ran_at));
      if (!b) continue; // sınır dışı (saat dilimi kayması) — atla
      b.checkRuns += 1;
      if (r.decision) b.detections += 1;
    }
    for (const d of dels.data ?? []) {
      if (!d.sent_at) continue;
      const b = buckets.get(dayKey(d.sent_at));
      if (b) b.deliveries += 1;
    }
    return finalizeTimeseries(days, buckets);
  }
}
