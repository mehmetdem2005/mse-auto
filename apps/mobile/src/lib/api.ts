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
};
