import { useAuth } from "@/stores/auth";

const BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

// Yanıt tipleri — @watcher/contracts ile birebir aynı; Metro'da monorepo TS paketini
// transpile etme karmaşıklığını önlemek için burada yerel tutuldu.
export type BillingInterval = "month" | "year";
export interface Me {
  userId: string;
  email: string | null;
  isAdmin: boolean;
}
export interface Watch {
  id: string;
  rawIntent: string;
  archetype: "shared" | "personal";
  frequencyMinutes: number;
  status: "active" | "paused";
  createdAt: string;
}
export interface SubscriptionDetail {
  interval: BillingInterval;
  amountCents: number;
  currency: string;
  currentPeriodEnd: string;
  status: "active" | "canceled";
  cancelAtPeriodEnd: boolean;
}
export interface Subscription {
  plan: "free" | "pro";
  limits: { maxActiveWatches: number; minFrequencyMinutes: number };
  entitlements: {
    maxActiveWatches: number;
    minFrequencyMinutes: number;
    alarmChannel: boolean;
    allSounds: boolean;
    personalFilters: boolean;
  };
  usage: { activeWatches: number };
  subscription: SubscriptionDetail | null;
}
export interface Price {
  plan: "free" | "pro";
  interval: BillingInterval;
  amountCents: number;
  currency: string;
}
export interface Plans {
  prices: Price[];
}

// ---- Admin konsolu tipleri (backend @watcher/contracts ile birebir) ----
export interface AdminUser {
  id: string;
  email: string | null;
  createdAt: string;
  isAdmin: boolean;
  plan: "free" | "pro";
  watchCount: number;
}
export interface AdminWatch {
  id: string;
  userId: string;
  userEmail: string | null;
  rawIntent: string;
  archetype: "shared" | "personal";
  frequencyMinutes: number;
  status: "active" | "paused";
  createdAt: string;
}
export interface AdminSubscription {
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
export interface AdminSystem {
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
  recentDeliveries: { id: string; status: string; channel: string; sentAt: string | null }[];
}
export interface AdminStats {
  totalUsers: number;
  freeUsers: number;
  proUsers: number;
  activeSubscriptions: number;
  subscriptionsByInterval: { month: number; year: number };
  totalWatchers: number;
  activeWatchers: number;
  mrrCents: number;
}

// ---- Watcher "araştırma" geçmişi ----
export interface CheckRunView {
  id: string;
  ranAt: string;
  decision: boolean;
  confidence: number | null;
  summary: string | null;
  reasoning: string | null;
}
export interface DetectionEventView {
  id: string;
  description: string;
  detectedAt: string;
  facts: unknown;
}
export interface WatchTimeline {
  checkRuns: CheckRunView[];
  events: DetectionEventView[];
}

// ---- Birleşik aktivite akışı (feed) + geri bildirim ----
export interface FeedItem {
  deliveryId: string;
  watchId: string;
  watchIntent: string;
  eventId: string;
  description: string;
  detectedAt: string;
  facts: unknown;
  channel: string;
  status: string;
  readAt: string | null;
}
export type FeedbackVerdict = "correct" | "incorrect";

interface ReqInit {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
}

async function req<T>(path: string, init?: ReqInit): Promise<T> {
  const token = useAuth.getState().session?.token;
  const res = await fetch(`${BASE}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...(init?.body ? { body: init.body } : {}),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const b = (await res.json()) as { error?: string };
      if (b.error) msg = b.error;
    } catch {
      /* gövde yok */
    }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export const api = {
  me: () => req<Me>("/v1/me"),
  watchers: () => req<Watch[]>("/v1/watchers"),
  createWatcher: (rawIntent: string, frequencyMinutes: number) =>
    req<Watch>("/v1/watchers", {
      method: "POST",
      body: JSON.stringify({ rawIntent, frequencyMinutes }),
    }),
  subscription: () => req<Subscription>("/v1/subscription"),
  plans: () => req<Plans>("/v1/plans"),
  subscribe: (interval: BillingInterval) =>
    req<Subscription>("/v1/subscription", {
      method: "POST",
      body: JSON.stringify({ plan: "pro", interval }),
    }),
  cancel: () => req<Subscription>("/v1/subscription/cancel", { method: "POST" }),
  registerDevice: (fcmToken: string, platform: "android" | "ios") =>
    req<{ ok: boolean }>("/v1/devices", {
      method: "POST",
      body: JSON.stringify({ fcmToken, platform }),
    }),
  deleteAccount: () => req<{ ok: boolean }>("/v1/me", { method: "DELETE" }),

  // ---- Admin konsolu ----
  adminUsers: () => req<AdminUser[]>("/v1/admin/users"),
  setUserAdmin: (id: string, makeAdmin: boolean) =>
    req<{ ok: boolean }>(`/v1/admin/users/${id}/admin`, {
      method: "POST",
      body: JSON.stringify({ makeAdmin }),
    }),
  deleteUser: (id: string) => req<{ ok: boolean }>(`/v1/admin/users/${id}`, { method: "DELETE" }),
  giftPro: (id: string, interval: BillingInterval) =>
    req<{ ok: boolean }>(`/v1/admin/users/${id}/gift-pro`, {
      method: "POST",
      body: JSON.stringify({ interval }),
    }),
  cancelUserSub: (id: string) =>
    req<{ ok: boolean }>(`/v1/admin/users/${id}/cancel-subscription`, { method: "POST" }),
  adminWatches: () => req<AdminWatch[]>("/v1/admin/watches"),
  setWatchStatus: (id: string, status: "active" | "paused") =>
    req<{ ok: boolean }>(`/v1/admin/watches/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),
  deleteWatch: (id: string) =>
    req<{ ok: boolean }>(`/v1/admin/watches/${id}`, { method: "DELETE" }),
  adminSubscriptions: () => req<AdminSubscription[]>("/v1/admin/subscriptions"),
  adminSystem: () => req<AdminSystem>("/v1/admin/system"),
  adminStats: () => req<AdminStats>("/v1/admin/analytics"),
  adminPrices: () => req<Plans>("/v1/admin/prices"),
  setPrice: (interval: BillingInterval, amountCents: number, currency: string) =>
    req<Plans>("/v1/admin/prices", {
      method: "PUT",
      body: JSON.stringify({ plan: "pro", interval, amountCents, currency }),
    }),
  watcherTimeline: (id: string) => req<WatchTimeline>(`/v1/watchers/${id}/timeline`),
  adminWatchTimeline: (id: string) => req<WatchTimeline>(`/v1/admin/watches/${id}/timeline`),
  feed: () => req<FeedItem[]>("/v1/feed"),
  feedback: (eventId: string, verdict: FeedbackVerdict) =>
    req<{ ok: boolean }>(`/v1/events/${eventId}/feedback`, {
      method: "POST",
      body: JSON.stringify({ verdict }),
    }),
  markFeedRead: (deliveryId: string) =>
    req<{ ok: boolean }>(`/v1/feed/${deliveryId}/read`, { method: "POST" }),
  markAllFeedRead: () => req<{ count: number }>("/v1/feed/read-all", { method: "POST" }),
};
