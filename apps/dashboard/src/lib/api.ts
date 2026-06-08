import type { AdminStats, BillingInterval, Me, Plans, Subscription } from "@watcher/contracts";

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
};
