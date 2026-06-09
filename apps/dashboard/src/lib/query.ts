import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } },
});

export const qk = {
  feed: ["feed"] as const,
  subscription: ["subscription"] as const,
  plans: ["plans"] as const,
  adminUsers: ["admin", "users"] as const,
  adminWatches: ["admin", "watches"] as const,
  adminSubscriptions: ["admin", "subscriptions"] as const,
  adminStats: ["admin", "stats"] as const,
  adminPrices: ["admin", "prices"] as const,
  adminSystem: ["admin", "system"] as const,
};
