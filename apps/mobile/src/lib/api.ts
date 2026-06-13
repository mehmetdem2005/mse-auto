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
  authorityDomain?: string | null;
  lastCheckedAt?: string | null;
  /** Sonuç bulununca otomatik durdurma (ADR-092). */
  stopAfterHit?: boolean;
  /** Otomatik durdurma gerçekleştiyse anı — kartta "sonuç bulundu" rozeti. */
  completedAt?: string | null;
}
/** Admin trafik özeti (ADR-091) — site/uygulama edinim sinyali. */
export interface TrafficTopItem {
  key: string;
  count: number;
}
export interface TrafficBreakdown {
  total: number;
  refs: TrafficTopItem[];
  utms: TrafficTopItem[];
  paths: TrafficTopItem[];
  langs: TrafficTopItem[];
  platforms: TrafficTopItem[];
}
export interface AdminTraffic {
  days: { date: string; site: number; app: number }[];
  site: TrafficBreakdown;
  app: TrafficBreakdown;
}
export interface MeStats {
  watchers: number;
  activeWatchers: number;
  checks24h: number;
}
export type ChannelKind = "telegram" | "email" | "whatsapp";
export interface UserChannels {
  telegramChatId: string | null;
  email: string | null;
  whatsappTo: string | null;
  enabled: ChannelKind[];
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
/** Kullanıcı 360° detayı (ADR-101). */
export interface AdminUserDetail extends AdminUser {
  subscription: AdminSubscription | null;
  watches: {
    id: string;
    rawIntent: string;
    status: "active" | "paused";
    frequencyMinutes: number;
    createdAt: string;
  }[];
  channels: { telegram: boolean; email: boolean; whatsapp: boolean; enabled: string[] } | null;
  devices: { id: string; platform: string; createdAt: string }[];
  support: { open: number; total: number };
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
  services: { name: string; ok: boolean }[];
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
export interface AdminTimeseriesPoint {
  date: string;
  checkRuns: number;
  detections: number;
  deliveries: number;
}
export interface AdminTimeseries {
  days: number;
  points: AdminTimeseriesPoint[];
  totals: { checkRuns: number; detections: number; deliveries: number };
}

// ---- LLM model seçimi + sağlayıcı kullanım panosu (ADR-095) ----
export interface LlmModel {
  id: string;
  provider: "groq" | "deepseek";
  model: string;
  label: string;
  note: string;
  available: boolean;
}
export interface LlmConfig {
  active: string | null;
  /** false → app_settings migration'ı canlıda yok; seçim deploy'da sıfırlanır. */
  persisted: boolean;
  models: LlmModel[];
}
export interface ProviderMetric {
  label: string;
  value: string;
  limit: string | null;
}
export interface ProviderUsage {
  id: "deepseek" | "groq" | "supabase" | "render" | "vercel";
  name: string;
  configured: boolean;
  ok: boolean;
  metrics: ProviderMetric[];
  error: string | null;
  consoleUrl: string;
  fetchedAt: string;
}
export interface AdminProviders {
  providers: ProviderUsage[];
}

// ---- Gelir & büyüme (ADR-103) ----
export interface AdminGrowth {
  days: number;
  signups: { date: string; count: number }[];
  totalUsers: number;
  newUsersInRange: number;
  funnel: { free: number; pro: number; conversionRate: number };
  churn: { canceled: number };
  mrrCents: number;
}

// ---- Operasyon & sağlık (ADR-102) ----
export interface AdminOps {
  days: number;
  checks: {
    total: number;
    detections: number;
    detectionRate: number;
    avgConfidence: number | null;
    tokensUsed: number;
  };
  deliveries: {
    total: number;
    byStatus: { key: string; count: number }[];
    byChannel: { key: string; count: number }[];
  };
}

// ---- Duyurular (ADR-100) ----
export type AnnouncementKind = "info" | "update" | "promo" | "warning";
export interface Announcement {
  id: string;
  title: string;
  body: string;
  kind: AnnouncementKind;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  pinned: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface AnnouncementInput {
  title: string;
  body: string;
  kind: AnnouncementKind;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  pinned: boolean;
  published: boolean;
}

// ---- Watcher "araştırma" geçmişi ----
export interface SearchHitView {
  title: string;
  snippet: string;
  url: string;
  date: string | null;
}
export interface CheckRunView {
  id: string;
  ranAt: string;
  decision: boolean;
  confidence: number | null;
  summary: string | null;
  reasoning: string | null;
  searchQuery: string | null;
  hits: SearchHitView[] | null;
  tokensUsed?: number | null;
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
  confidence?: number | null;
  channel: string;
  status: string;
  readAt: string | null;
}
export type FeedbackVerdict = "correct" | "incorrect";

// ---- Destek (sorun bildir + canlı destek) ----
export type SupportKind = "problem" | "live";
export interface SupportTicket {
  id: string;
  kind: SupportKind;
  status: "open" | "closed";
  createdAt: string;
  updatedAt: string;
  lastMessage: string | null;
}
export interface SupportMessage {
  id: string;
  sender: "user" | "admin";
  body: string;
  createdAt: string;
}
export interface AdminSupportTicket extends SupportTicket {
  userId: string;
  userEmail: string | null;
}

// ---- Niyet asistanı (sohbet) ----
export type AssistRole = "user" | "assistant";
export interface AssistMessage {
  role: AssistRole;
  content: string;
}
export interface AssistReply {
  ready: boolean;
  message: string;
  intent: string | null;
  frequencyMinutes: number | null;
  confidence: number;
}

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

/** Auth'lu ham metin (CSV dışa aktarım — ADR-103). */
async function reqText(path: string): Promise<string> {
  const token = useAuth.getState().session?.token;
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export const api = {
  me: () => req<Me>("/v1/me"),
  meStats: () => req<MeStats>("/v1/me/stats"),
  watchers: () => req<Watch[]>("/v1/watchers"),
  createWatcher: (
    rawIntent: string,
    frequencyMinutes: number,
    sourcePref: "auto" | "news" | "official" | "web" = "auto",
    deepScan = false,
    stopAfterHit = true,
  ) =>
    req<Watch>("/v1/watchers", {
      method: "POST",
      body: JSON.stringify({ rawIntent, frequencyMinutes, sourcePref, deepScan, stopAfterHit }),
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
  // Veri dökümü (KVKK/GDPR taşınabilirlik) — serbest biçimli JSON, olduğu gibi indirilir.
  exportAccount: () => req<Record<string, unknown>>("/v1/me/export"),
  // Ek bildirim kanalları (ADR-084) — hesap düzeyi.
  channels: () => req<UserChannels>("/v1/me/channels"),
  setChannels: (c: UserChannels) =>
    req<UserChannels>("/v1/me/channels", { method: "PUT", body: JSON.stringify(c) }),

  // ---- Admin konsolu ----
  adminUsers: () => req<AdminUser[]>("/v1/admin/users"),
  adminUserDetail: (id: string) => req<AdminUserDetail>(`/v1/admin/users/${id}`),
  adminOps: (days = 7) => req<AdminOps>(`/v1/admin/ops?days=${days}`),
  adminGrowth: (days = 30) => req<AdminGrowth>(`/v1/admin/growth?days=${days}`),
  exportUsersCsv: () => reqText("/v1/admin/export/users.csv"),
  exportSubscriptionsCsv: () => reqText("/v1/admin/export/subscriptions.csv"),
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
  adminTimeseries: (days = 14) => req<AdminTimeseries>(`/v1/admin/timeseries?days=${days}`),
  adminTraffic: (days = 30) => req<AdminTraffic>(`/v1/admin/traffic?days=${days}`),
  adminModel: () => req<LlmConfig>("/v1/admin/model"),
  setAdminModel: (model: string) =>
    req<LlmConfig>("/v1/admin/model", { method: "PUT", body: JSON.stringify({ model }) }),
  adminProviders: () => req<AdminProviders>("/v1/admin/providers"),
  // ---- Duyurular (ADR-100) ----
  announcements: () => req<Announcement[]>("/v1/announcements"),
  adminAnnouncements: () => req<Announcement[]>("/v1/admin/announcements"),
  createAnnouncement: (input: AnnouncementInput) =>
    req<Announcement>("/v1/admin/announcements", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateAnnouncement: (id: string, patch: Partial<AnnouncementInput>) =>
    req<Announcement>(`/v1/admin/announcements/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteAnnouncement: (id: string) =>
    req<{ ok: boolean }>(`/v1/admin/announcements/${id}`, { method: "DELETE" }),
  adminPrices: () => req<Plans>("/v1/admin/prices"),
  setPrice: (interval: BillingInterval, amountCents: number, currency: string) =>
    req<Plans>("/v1/admin/prices", {
      method: "PUT",
      body: JSON.stringify({ plan: "pro", interval, amountCents, currency }),
    }),
  assistChat: (messages: AssistMessage[], lang?: string) =>
    req<AssistReply>("/v1/watchers/assist", {
      method: "POST",
      body: JSON.stringify({ messages, lang }),
    }),
  setMyWatchStatus: (id: string, status: "active" | "paused") =>
    req<Watch>(`/v1/watchers/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),
  deleteMyWatch: (id: string) => req<{ ok: boolean }>(`/v1/watchers/${id}`, { method: "DELETE" }),

  // ---- Destek ----
  createSupport: (kind: SupportKind, message: string) =>
    req<SupportTicket>("/v1/support", { method: "POST", body: JSON.stringify({ kind, message }) }),
  supportTickets: () => req<SupportTicket[]>("/v1/support"),
  supportMessages: (id: string) => req<SupportMessage[]>(`/v1/support/${id}/messages`),
  supportSend: (id: string, body: string) =>
    req<SupportMessage>(`/v1/support/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
  adminSupport: () => req<AdminSupportTicket[]>("/v1/admin/support"),
  adminSupportMessages: (id: string) => req<SupportMessage[]>(`/v1/admin/support/${id}/messages`),
  adminSupportReply: (id: string, body: string) =>
    req<SupportMessage>(`/v1/admin/support/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
  adminSupportClose: (id: string) =>
    req<{ ok: boolean }>(`/v1/admin/support/${id}/close`, { method: "POST" }),
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

/**
 * Kimliksiz trafik sinyali (ADR-091) — auth başlığı YOK, kullanıcı kimliği gitmez;
 * hata sessiz yutulur (telemetri kritik değildir, akışı asla etkilemez).
 */
export function sendTrafficBeacon(input: {
  source: "site" | "app";
  path?: string;
  ref?: string;
  utm?: string;
  lang?: string;
  platform?: "web" | "android" | "ios";
}): void {
  void fetch(`${BASE}/t`, {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: JSON.stringify(input),
  }).catch(() => undefined);
}
