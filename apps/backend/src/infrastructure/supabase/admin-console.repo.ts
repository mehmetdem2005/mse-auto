import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdminConsoleRepository,
  AdminGrowth,
  AdminOps,
  AdminSubscriptionRow,
  AdminSystemInfo,
  AdminTimeseriesData,
  AdminUserDetail,
  AdminUserRow,
  AdminWatchRow,
  BillingInterval,
} from "../../domain/billing";
import { addInterval } from "../../domain/billing";
import { channelHealth, deliveryHealth } from "../shared/delivery-health.util";
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

  async getUserDetail(userId: string): Promise<AdminUserDetail | null> {
    const { data: authData, error: authErr } = await this.db.auth.admin.getUserById(userId);
    if (authErr || !authData?.user) return null;
    const u = authData.user;
    const nowIso = new Date().toISOString();
    const [adminRes, subRes, watchRes, chanRes, devRes, ticketRes, profileRes] = await Promise.all([
      this.db.from("admins").select("user_id").eq("user_id", userId).maybeSingle(),
      this.db.from("subscriptions").select("*").eq("user_id", userId).maybeSingle(),
      this.db
        .from("watches")
        .select("id, raw_intent, status, frequency_minutes, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      this.db.from("user_channels").select("*").eq("user_id", userId).maybeSingle(),
      this.db
        .from("device_tokens")
        .select("id, platform, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      this.db.from("support_tickets").select("status").eq("user_id", userId),
      this.db.from("profiles").select("banned").eq("id", userId).maybeSingle(),
    ]);

    const sub = subRes.data;
    const isActivePro = !!sub && sub.status === "active" && (sub.current_period_end ?? "") > nowIso;
    const ch = chanRes.data;
    const tickets = ticketRes.data ?? [];
    const watches = watchRes.data ?? [];

    return {
      id: u.id,
      email: u.email ?? null,
      createdAt: u.created_at ?? nowIso,
      isAdmin: !!adminRes.data,
      plan: isActivePro ? "pro" : "free",
      watchCount: watches.length,
      subscription: sub
        ? {
            userId,
            userEmail: u.email ?? null,
            plan: sub.plan,
            interval: sub.billing_interval,
            amountCents: sub.amount_cents,
            currency: sub.currency,
            status: sub.status,
            currentPeriodEnd: sub.current_period_end,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          }
        : null,
      watches: watches.map((w) => ({
        id: w.id,
        rawIntent: w.raw_intent,
        status: w.status,
        frequencyMinutes: w.frequency_minutes,
        createdAt: w.created_at,
      })),
      channels: ch
        ? {
            telegram: (ch.enabled ?? []).includes("telegram"),
            email: (ch.enabled ?? []).includes("email"),
            whatsapp: (ch.enabled ?? []).includes("whatsapp"),
            enabled: ch.enabled ?? [],
          }
        : null,
      devices: (devRes.data ?? []).map((d) => ({
        id: d.id,
        platform: d.platform,
        createdAt: d.created_at,
      })),
      support: {
        open: tickets.filter((t) => t.status === "open").length,
        total: tickets.length,
      },
      banned: profileRes.data?.banned ?? false,
    };
  }

  async getOps(days: number): Promise<AdminOps> {
    const since = sinceIso(days);
    const [runsRes, delsRes] = await Promise.all([
      this.db.from("check_runs").select("decision, confidence, tokens_used").gte("ran_at", since),
      this.db.from("deliveries").select("status, channel").gte("sent_at", since),
    ]);
    if (runsRes.error) throw new Error(`ops check_runs: ${runsRes.error.message}`);
    if (delsRes.error) throw new Error(`ops deliveries: ${delsRes.error.message}`);
    const runs = runsRes.data ?? [];
    const dels = delsRes.data ?? [];

    const detections = runs.filter((r) => r.decision).length;
    const confidences = runs.map((r) => r.confidence).filter((c): c is number => c !== null);
    const avgConfidence =
      confidences.length > 0 ? confidences.reduce((a, c) => a + c, 0) / confidences.length : null;
    const tokensUsed = runs.reduce((a, r) => a + (r.tokens_used ?? 0), 0);

    // ADR-142: teslimat sağlığı (saf hesap → test edilebilir util).
    const { successRate, failed } = deliveryHealth(dels.map((d) => d.status));

    const tally = (rows: { key: string | null }[]): { key: string; count: number }[] => {
      const m = new Map<string, number>();
      for (const r of rows) {
        const k = r.key ?? "—";
        m.set(k, (m.get(k) ?? 0) + 1);
      }
      return [...m.entries()]
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count);
    };

    return {
      days,
      checks: {
        total: runs.length,
        detections,
        detectionRate: runs.length > 0 ? Math.round((detections / runs.length) * 100) : 0,
        avgConfidence,
        tokensUsed,
      },
      deliveries: {
        total: dels.length,
        successRate,
        failed,
        byStatus: tally(dels.map((d) => ({ key: d.status }))),
        byChannel: tally(dels.map((d) => ({ key: d.channel }))),
        channelHealth: channelHealth(dels.map((d) => ({ status: d.status, channel: d.channel }))),
      },
    };
  }

  async getGrowth(days: number): Promise<AdminGrowth> {
    const since = sinceIso(days);
    const nowIso = new Date().toISOString();
    const [users, proIds, activeSubs, canceledSubs] = await Promise.all([
      this.authUserList(),
      this.activeProUserIds(),
      // MRR kaynağı analytics.repo ile AYNI kanon: status=active + süresi geçmemiş + yıllık /12.
      this.db
        .from("subscriptions")
        .select("amount_cents, billing_interval")
        .eq("status", "active")
        .gt("current_period_end", nowIso),
      this.db
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "canceled"),
    ]);
    if (activeSubs.error) throw new Error(`growth subs: ${activeSubs.error.message}`);

    // Günlük kayıt kovaları — emptyBuckets sıralı gün anahtarlarını verir.
    const dayCounts = new Map<string, number>([...emptyBuckets(days).keys()].map((k) => [k, 0]));
    let newInRange = 0;
    for (const u of users) {
      if (u.createdAt < since) continue;
      newInRange += 1;
      const k = dayKey(u.createdAt);
      if (dayCounts.has(k)) dayCounts.set(k, (dayCounts.get(k) ?? 0) + 1);
    }
    const signups = [...dayCounts.entries()].map(([date, count]) => ({ date, count }));

    const pro = proIds.size;
    const total = users.length;
    // Yıllık abonelik aylığa normalize (/12) — home/analytics MRR'ı ile birebir tutarlı.
    const mrrCents = (activeSubs.data ?? []).reduce(
      (a, s) =>
        a +
        (s.billing_interval === "year"
          ? Math.round((s.amount_cents ?? 0) / 12)
          : (s.amount_cents ?? 0)),
      0,
    );
    return {
      days,
      signups,
      totalUsers: total,
      newUsersInRange: newInRange,
      funnel: {
        free: Math.max(0, total - pro),
        pro,
        conversionRate: total > 0 ? Math.round((pro / total) * 100) : 0,
      },
      churn: { canceled: canceledSubs.count ?? 0 },
      mrrCents,
    };
  }

  async segmentTokens(segment: "all" | "free" | "pro"): Promise<string[]> {
    const { data, error } = await this.db.from("device_tokens").select("fcm_token, user_id");
    if (error) throw new Error(`segment tokens: ${error.message}`);
    const rows = data ?? [];
    if (segment === "all") return rows.map((r) => r.fcm_token);
    const proIds = await this.activeProUserIds();
    return rows
      .filter((r) => (segment === "pro" ? proIds.has(r.user_id) : !proIds.has(r.user_id)))
      .map((r) => r.fcm_token);
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
