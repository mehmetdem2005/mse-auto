import type { Plan } from "./plan";

export type BillingInterval = "month" | "year";

/** Fiyat kataloğu kaydı (sürümlenir; bir (plan,interval) için tek aktif). */
export interface Price {
  plan: Plan; // "pro"
  interval: BillingInterval;
  amountCents: number;
  currency: string;
  active: boolean;
}

/** Kullanıcı aboneliği. amountCents = satın alındığı fiyat (grandfathered snapshot). */
export interface Subscription {
  userId: string;
  plan: Plan; // "pro"
  interval: BillingInterval;
  amountCents: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  status: "active" | "canceled";
  cancelAtPeriodEnd: boolean;
}

export interface AdminStats {
  totalUsers: number;
  freeUsers: number;
  proUsers: number;
  activeSubscriptions: number;
  subscriptionsByInterval: { month: number; year: number };
  totalWatchers: number;
  activeWatchers: number;
  mrrCents: number; // aylık tekrarlayan gelir (yıllık /12)
}

/** Etkin plan: aktif + dönemi geçmemiş abonelik → plan; aksi halde free. */
export function effectivePlan(sub: Subscription | null, now: Date): Plan {
  if (sub && sub.status === "active" && new Date(sub.currentPeriodEnd).getTime() > now.getTime()) {
    return sub.plan;
  }
  return "free";
}

export function addInterval(from: Date, interval: BillingInterval): Date {
  const d = new Date(from);
  if (interval === "month") d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return d;
}

export function monthlyEquivalentCents(sub: Subscription): number {
  return sub.interval === "year" ? Math.round(sub.amountCents / 12) : sub.amountCents;
}

export function isActive(sub: Subscription | null, now: Date): boolean {
  return (
    sub !== null &&
    sub.status === "active" &&
    new Date(sub.currentPeriodEnd).getTime() > now.getTime()
  );
}

export interface PriceRepository {
  listActive(): Promise<Price[]>;
  getActive(plan: Plan, interval: BillingInterval): Promise<Price | null>;
  /** Yeni aktif fiyat ekler, (plan,interval) için eskiyi pasifler (sürümleme). */
  setPrice(
    plan: Plan,
    interval: BillingInterval,
    amountCents: number,
    currency: string,
  ): Promise<void>;
}

export interface AdminRepository {
  isAdmin(userId: string): Promise<boolean>;
  /** Tüm admin kullanıcı id'leri (destek bildirimi fan-out'u için). */
  listAdminIds(): Promise<string[]>;
}

export interface AnalyticsRepository {
  getStats(): Promise<AdminStats>;
}

// ---- Admin konsolu: yönetim okuma/yazma (kullanıcı, watcher, abonelik, sistem) ----

export interface AdminUserRow {
  id: string;
  email: string | null;
  createdAt: string;
  isAdmin: boolean;
  plan: "free" | "pro";
  watchCount: number;
}

export interface AdminWatchRow {
  id: string;
  userId: string;
  userEmail: string | null;
  rawIntent: string;
  archetype: "shared" | "personal";
  frequencyMinutes: number;
  status: "active" | "paused";
  createdAt: string;
}

export interface AdminSubscriptionRow {
  userId: string;
  userEmail: string | null;
  plan: string;
  interval: BillingInterval | null;
  amountCents: number | null;
  currency: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface AdminSystemInfo {
  now: string;
  backend: string;
  counts: {
    users: number;
    watches: number;
    activeWatches: number;
    subscriptions: number;
    deliveries: number;
    checkRuns: number;
  };
  recentCheckRuns: {
    id: string;
    topicId: string;
    ranAt: string;
    decision: boolean;
    confidence: number | null;
    summary: string | null;
  }[];
  recentDeliveries: {
    id: string;
    status: string;
    channel: string;
    sentAt: string | null;
  }[];
}

/** Günlük kova (UTC, YYYY-MM-DD) — istatistik/grafik için zaman serisi. */
export interface AdminTimeseriesPoint {
  date: string;
  checkRuns: number;
  detections: number;
  deliveries: number;
}

export interface AdminTimeseriesData {
  days: number;
  points: AdminTimeseriesPoint[];
  totals: { checkRuns: number; detections: number; deliveries: number };
}

/** Kullanıcı 360° detayı (ADR-101) — tek kullanıcının tüm ilişkili verisi (PII zonu). */
export interface AdminUserDetail extends AdminUserRow {
  subscription: AdminSubscriptionRow | null;
  watches: {
    id: string;
    rawIntent: string;
    status: "active" | "paused";
    frequencyMinutes: number;
    createdAt: string;
  }[];
  /** Ek bildirim kanalları (ADR-084) durumu; hiç ayarlanmadıysa null. */
  channels: { telegram: boolean; email: boolean; whatsapp: boolean; enabled: string[] } | null;
  devices: { id: string; platform: string; createdAt: string }[];
  support: { open: number; total: number };
}

/** Operasyon & sağlık anlık görüntüsü (ADR-102) — son `days` günlük işleyiş özeti. */
export interface AdminOps {
  days: number;
  checks: {
    total: number;
    detections: number;
    detectionRate: number; // 0..100
    avgConfidence: number | null; // 0..1
    tokensUsed: number;
  };
  deliveries: {
    total: number;
    byStatus: { key: string; count: number }[];
    byChannel: { key: string; count: number }[];
  };
}

/** Gelir & büyüme analitiği (ADR-103). */
export interface AdminGrowth {
  days: number;
  /** Günlük yeni kayıt (eskiden yeniye), son `days` gün. */
  signups: { date: string; count: number }[];
  totalUsers: number;
  newUsersInRange: number;
  funnel: { free: number; pro: number; conversionRate: number };
  churn: { canceled: number };
  mrrCents: number;
}

/** Admin paneli için yönetim işlemleri (yalnız admin middleware arkasında). */
export interface AdminConsoleRepository {
  listUsers(): Promise<AdminUserRow[]>;
  /** Operasyon & sağlık özeti (son `days` gün). */
  getOps(days: number): Promise<AdminOps>;
  /** Gelir & büyüme analitiği (son `days` gün). */
  getGrowth(days: number): Promise<AdminGrowth>;
  /** Tek kullanıcının 360° detayı; yoksa null. */
  getUserDetail(userId: string): Promise<AdminUserDetail | null>;
  setAdmin(userId: string, makeAdmin: boolean): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  listWatches(): Promise<AdminWatchRow[]>;
  setWatchStatus(watchId: string, status: "active" | "paused"): Promise<void>;
  deleteWatch(watchId: string): Promise<void>;
  listSubscriptions(): Promise<AdminSubscriptionRow[]>;
  giftPro(userId: string, interval: BillingInterval): Promise<void>;
  cancelSubscription(userId: string): Promise<void>;
  getSystem(): Promise<AdminSystemInfo>;
  /** Son `days` günün günlük kontrol/tespit/teslimat sayıları (eskiden yeniye). */
  getTimeseries(days: number): Promise<AdminTimeseriesData>;
}
