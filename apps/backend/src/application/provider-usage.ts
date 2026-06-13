import type { AdminProviders } from "@watcher/contracts";
import type { ProviderUsagePort } from "../domain/providers";

export async function getProviderUsage(deps: {
  providerUsage: ProviderUsagePort;
}): Promise<AdminProviders> {
  return { providers: await deps.providerUsage.fetchAll() };
}
