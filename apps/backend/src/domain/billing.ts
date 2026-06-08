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
}

export interface AnalyticsRepository {
  getStats(): Promise<AdminStats>;
}
