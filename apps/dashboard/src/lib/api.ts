import type {
  AdminStats,
  AdminSubscription,
  AdminSystem,
  AdminUser,
  AdminWatch,
  BillingInterval,
  FeedItem,
  Me,
  Plans,
  Subscription,
} from "@watcher/contracts";

type Ok = { ok: boolean };

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:3000";

async function req<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) msg = body.error;
    } catch {
      /* gövde yok */
    }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export const api = {
  me: (t: string) => req<Me>("/v1/me", t),
  feed: (t: string) => req<FeedItem[]>("/v1/feed", t),
  subscription: (t: string) => req<Subscription>("/v1/subscription", t),
  plans: (t: string) => req<Plans>("/v1/plans", t),
  subscribe: (t: string, interval: BillingInterval) =>
    req<Subscription>("/v1/subscription", t, {
      method: "POST",
      body: JSON.stringify({ plan: "pro", interval }),
    }),
  cancel: (t: string) => req<Subscription>("/v1/subscription/cancel", t, { method: "POST" }),
  adminStats: (t: string) => req<AdminStats>("/v1/admin/analytics", t),
  adminPrices: (t: string) => req<Plans>("/v1/admin/prices", t),
  setPrice: (t: string, interval: BillingInterval, amountCents: number, currency: string) =>
    req<Plans>("/v1/admin/prices", t, {
      method: "PUT",
      body: JSON.stringify({ plan: "pro", interval, amountCents, currency }),
    }),

  // ---- Admin konsolu ----
  adminUsers: (t: string) => req<AdminUser[]>("/v1/admin/users", t),
  setUserAdmin: (t: string, id: string, makeAdmin: boolean) =>
    req<Ok>(`/v1/admin/users/${id}/admin`, t, {
      method: "POST",
      body: JSON.stringify({ makeAdmin }),
    }),
  deleteUser: (t: string, id: string) => req<Ok>(`/v1/admin/users/${id}`, t, { method: "DELETE" }),
  giftPro: (t: string, id: string, interval: BillingInterval) =>
    req<Ok>(`/v1/admin/users/${id}/gift-pro`, t, {
      method: "POST",
      body: JSON.stringify({ interval }),
    }),
  cancelUserSub: (t: string, id: string) =>
    req<Ok>(`/v1/admin/users/${id}/cancel-subscription`, t, { method: "POST" }),
  adminWatches: (t: string) => req<AdminWatch[]>("/v1/admin/watches", t),
  setWatchStatus: (t: string, id: string, status: "active" | "paused") =>
    req<Ok>(`/v1/admin/watches/${id}/status`, t, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),
  deleteWatch: (t: string, id: string) =>
    req<Ok>(`/v1/admin/watches/${id}`, t, { method: "DELETE" }),
  adminSubscriptions: (t: string) => req<AdminSubscription[]>("/v1/admin/subscriptions", t),
  adminSystem: (t: string) => req<AdminSystem>("/v1/admin/system", t),
};
