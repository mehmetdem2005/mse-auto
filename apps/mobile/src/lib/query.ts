import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export const qk = {
  me: ["me"] as const,
  watchers: ["watchers"] as const,
  subscription: ["subscription"] as const,
  plans: ["plans"] as const,
  adminUsers: ["admin", "users"] as const,
  adminWatches: ["admin", "watches"] as const,
  adminSubscriptions: ["admin", "subscriptions"] as const,
  adminSystem: ["admin", "system"] as const,
};
