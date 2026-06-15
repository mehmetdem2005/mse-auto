import type { SupabaseClient } from "@supabase/supabase-js";
import { InMemoryAccountGateway } from "../../infrastructure/in-memory/account.gateway";
import { InMemoryAdminConsoleRepository } from "../../infrastructure/in-memory/admin-console.repo";
import { InMemoryAdminRepository } from "../../infrastructure/in-memory/admin.repo";
import { InMemoryAiProfileRepository } from "../../infrastructure/in-memory/ai-profile.repo";
import { InMemoryAnalyticsRepository } from "../../infrastructure/in-memory/analytics.repo";
import { InMemoryAnnouncementRepository } from "../../infrastructure/in-memory/announcement.repo";
import { InMemoryDeviceRepository } from "../../infrastructure/in-memory/device.repo";
import { InMemoryModerationRepository } from "../../infrastructure/in-memory/moderation.repo";
import { InMemoryMonitoringRepository } from "../../infrastructure/in-memory/monitoring.repo";
import { InMemoryPriceRepository } from "../../infrastructure/in-memory/price.repo";
import { InMemoryStore } from "../../infrastructure/in-memory/store";
import { InMemorySubscriptionRepository } from "../../infrastructure/in-memory/subscription.repo";
import { InMemorySupportRepository } from "../../infrastructure/in-memory/support.repo";
import { InMemoryCanonicalTopicRepository } from "../../infrastructure/in-memory/topic.repo";
import { InMemoryTrafficRepository } from "../../infrastructure/in-memory/traffic.repo";
import { InMemoryUserChannelRepository } from "../../infrastructure/in-memory/user-channels.repo";
import { InMemoryWatchRepository } from "../../infrastructure/in-memory/watch.repo";
import { SupabaseAccountGateway } from "../../infrastructure/supabase/account.gateway";
import { SupabaseAdminConsoleRepository } from "../../infrastructure/supabase/admin-console.repo";
import { SupabaseAdminRepository } from "../../infrastructure/supabase/admin.repo";
import { SupabaseAiProfileRepository } from "../../infrastructure/supabase/ai-profile.repo";
import { SupabaseAnalyticsRepository } from "../../infrastructure/supabase/analytics.repo";
import { SupabaseAnnouncementRepository } from "../../infrastructure/supabase/announcement.repo";
import type { Database } from "../../infrastructure/supabase/database.types";
import { SupabaseDeviceRepository } from "../../infrastructure/supabase/device.repo";
import { SupabaseModerationRepository } from "../../infrastructure/supabase/moderation.repo";
import { SupabaseMonitoringRepository } from "../../infrastructure/supabase/monitoring.repo";
import { SupabasePriceRepository } from "../../infrastructure/supabase/price.repo";
import { SupabaseSubscriptionRepository } from "../../infrastructure/supabase/subscription.repo";
import { SupabaseSupportRepository } from "../../infrastructure/supabase/support.repo";
import { SupabaseCanonicalTopicRepository } from "../../infrastructure/supabase/topic.repo";
import { SupabaseTrafficRepository } from "../../infrastructure/supabase/traffic.repo";
import { SupabaseUserChannelRepository } from "../../infrastructure/supabase/user-channels.repo";
import { SupabaseWatchRepository } from "../../infrastructure/supabase/watch.repo";
import type { Env } from "../env";
import type { ContainerRepositories } from "./types";

/**
 * Repository fabrikaları (ADR-137 — container modülerleştirme). Eski monolitte db/in-memory
 * dalları iki near-identical nesne literaliyle tekrarlanıyordu (yeni repo → iki yere eklenmeli;
 * unutma riski). Artık her backing store kendi fabrikasında; container yalnızca birini seçip yayar.
 * NOT: `settings` createContainer'da AYRI kurulur (LLM/embedding router'larından ÖNCE gerekir) — burada değil.
 */

export function buildSupabaseRepositories(db: SupabaseClient<Database>): ContainerRepositories {
  return {
    topics: new SupabaseCanonicalTopicRepository(db),
    watches: new SupabaseWatchRepository(db),
    monitoring: new SupabaseMonitoringRepository(db),
    devices: new SupabaseDeviceRepository(db),
    subscriptions: new SupabaseSubscriptionRepository(db),
    account: new SupabaseAccountGateway(db),
    aiProfile: new SupabaseAiProfileRepository(db),
    userChannels: new SupabaseUserChannelRepository(db),
    prices: new SupabasePriceRepository(db),
    admin: new SupabaseAdminRepository(db),
    adminConsole: new SupabaseAdminConsoleRepository(db),
    moderation: new SupabaseModerationRepository(db),
    analytics: new SupabaseAnalyticsRepository(db),
    support: new SupabaseSupportRepository(db),
    announcements: new SupabaseAnnouncementRepository(db),
    traffic: new SupabaseTrafficRepository(db),
  };
}

export function buildInMemoryRepositories(env: Env): ContainerRepositories {
  const store = new InMemoryStore();
  return {
    topics: new InMemoryCanonicalTopicRepository(store),
    watches: new InMemoryWatchRepository(store),
    monitoring: new InMemoryMonitoringRepository(store),
    devices: new InMemoryDeviceRepository(store),
    subscriptions: new InMemorySubscriptionRepository(store),
    account: new InMemoryAccountGateway(store),
    aiProfile: new InMemoryAiProfileRepository(),
    userChannels: new InMemoryUserChannelRepository(store),
    prices: new InMemoryPriceRepository(store),
    admin: new InMemoryAdminRepository(adminIdsFromEnv(env)),
    adminConsole: new InMemoryAdminConsoleRepository(),
    moderation: new InMemoryModerationRepository(),
    analytics: new InMemoryAnalyticsRepository(store),
    support: new InMemorySupportRepository(store),
    announcements: new InMemoryAnnouncementRepository(),
    traffic: new InMemoryTrafficRepository(),
  };
}

/** In-memory (dev) modda admin kimlikleri env'den gelir (ADMIN_USER_IDS, virgül-ayrımlı). */
function adminIdsFromEnv(env: Env): ReadonlySet<string> {
  return new Set(
    (env.ADMIN_USER_IDS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
  );
}
