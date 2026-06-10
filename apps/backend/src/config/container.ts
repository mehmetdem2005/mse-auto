import type { AccountGateway } from "../domain/account";
import type { AuthVerifier } from "../domain/auth";
import type { AuthorityResolver } from "../domain/authority";
import type {
  AdminConsoleRepository,
  AdminRepository,
  AnalyticsRepository,
  PriceRepository,
} from "../domain/billing";
import type { Checker } from "../domain/checker";
import type { DeviceRepository } from "../domain/device";
import type { IntentAssistant } from "../domain/intent-assistant";
import type { MonitoringRepository } from "../domain/monitoring";
import type { Notifier } from "../domain/notifier";
import type { PaymentGateway } from "../domain/payment";
import type { CanonicalTopicRepository, WatchRepository } from "../domain/ports";
import type { JobQueue } from "../domain/queue";
import type { RateLimiter } from "../domain/rate-limit";
import type { SearchProvider } from "../domain/search";
import type { SubscriptionRepository } from "../domain/subscription";
import type { SupportRepository } from "../domain/support";
import { GroqIntentAssistant } from "../infrastructure/assistant/groq.assistant";
import { HeuristicIntentAssistant } from "../infrastructure/assistant/heuristic.assistant";
import { DevAuthVerifier } from "../infrastructure/auth/dev.verifier";
import { SupabaseJwtVerifier } from "../infrastructure/auth/supabase.verifier";
import { LiveChecker } from "../infrastructure/checker/live.checker";
import { StubChecker } from "../infrastructure/checker/stub.checker";
import { InMemoryAccountGateway } from "../infrastructure/in-memory/account.gateway";
import { InMemoryAdminConsoleRepository } from "../infrastructure/in-memory/admin-console.repo";
import { InMemoryAdminRepository } from "../infrastructure/in-memory/admin.repo";
import { InMemoryAnalyticsRepository } from "../infrastructure/in-memory/analytics.repo";
import { InMemoryDeviceRepository } from "../infrastructure/in-memory/device.repo";
import { InMemoryMonitoringRepository } from "../infrastructure/in-memory/monitoring.repo";
import { InMemoryPaymentGateway } from "../infrastructure/in-memory/payment.gateway";
import { InMemoryPriceRepository } from "../infrastructure/in-memory/price.repo";
import { InMemoryStore } from "../infrastructure/in-memory/store";
import { InMemorySubscriptionRepository } from "../infrastructure/in-memory/subscription.repo";
import { InMemorySupportRepository } from "../infrastructure/in-memory/support.repo";
import { InMemoryCanonicalTopicRepository } from "../infrastructure/in-memory/topic.repo";
import { InMemoryWatchRepository } from "../infrastructure/in-memory/watch.repo";
import { logger } from "../infrastructure/logging/logger";
import type { Logger } from "../infrastructure/logging/logger";
import { FcmNotifier } from "../infrastructure/notifier/fcm.notifier";
import { NoopNotifier } from "../infrastructure/notifier/noop.notifier";
import { GoogleAuthTokenProvider } from "../infrastructure/notifier/token";
import { StripePaymentGateway } from "../infrastructure/payment/stripe.gateway";
import { InMemoryJobQueue } from "../infrastructure/queue/in-memory.queue";
import { PgBossJobQueue } from "../infrastructure/queue/pgboss.queue";
import { InMemoryRateLimiter } from "../infrastructure/rate-limit/in-memory.limiter";
import { DeepSeekEventReasoner } from "../infrastructure/reasoner/deepseek.reasoner";
import { GroqEventReasoner } from "../infrastructure/reasoner/groq.reasoner";
import { FallbackSearchProvider } from "../infrastructure/search/fallback.search";
import {
  GroqAuthorityResolver,
  NullAuthorityResolver,
} from "../infrastructure/search/groq.authority";
import { SerperSearchProvider } from "../infrastructure/search/serper.search";
import { TavilySearchProvider } from "../infrastructure/search/tavily.search";
import { SupabaseAccountGateway } from "../infrastructure/supabase/account.gateway";
import { SupabaseAdminConsoleRepository } from "../infrastructure/supabase/admin-console.repo";
import { SupabaseAdminRepository } from "../infrastructure/supabase/admin.repo";
import { SupabaseAnalyticsRepository } from "../infrastructure/supabase/analytics.repo";
import { createSupabaseAdminClient } from "../infrastructure/supabase/client";
import { SupabaseDeviceRepository } from "../infrastructure/supabase/device.repo";
import { SupabaseMonitoringRepository } from "../infrastructure/supabase/monitoring.repo";
import { SupabasePriceRepository } from "../infrastructure/supabase/price.repo";
import { SupabaseSubscriptionRepository } from "../infrastructure/supabase/subscription.repo";
import { SupabaseSupportRepository } from "../infrastructure/supabase/support.repo";
import { SupabaseCanonicalTopicRepository } from "../infrastructure/supabase/topic.repo";
import { SupabaseWatchRepository } from "../infrastructure/supabase/watch.repo";
import type { Env } from "./env";

export interface Container {
  topics: CanonicalTopicRepository;
  watches: WatchRepository;
  monitoring: MonitoringRepository;
  devices: DeviceRepository;
  subscriptions: SubscriptionRepository;
  account: AccountGateway;
  prices: PriceRepository;
  admin: AdminRepository;
  adminConsole: AdminConsoleRepository;
  analytics: AnalyticsRepository;
  support: SupportRepository;
  checker: Checker;
  assistant: IntentAssistant;
  authority: AuthorityResolver;
  notifier: Notifier;
  queue: JobQueue;
  auth: AuthVerifier;
  payment: PaymentGateway;
  logger: Logger;
  rateLimit: { global: RateLimiter; createWatch: RateLimiter; assist: RateLimiter };
  /** Env'den türetilen GERÇEK servis yapılandırma durumu (admin sistem görünümü). */
  serviceHealth: { name: string; ok: boolean }[];
}

/** Hangi backing servislerin yapılandırıldığı — uydurma sağlık değil, gerçek config. */
function buildServiceHealth(env: Env): { name: string; ok: boolean }[] {
  return [
    { name: "Veritabanı (Supabase)", ok: !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) },
    { name: "Arama (Serper/Tavily)", ok: !!(env.SERPER_API_KEY || env.TAVILY_API_KEY) },
    { name: "Yapay zekâ (Groq/DeepSeek)", ok: !!(env.GROQ_API_KEY || env.DEEPSEEK_API_KEY) },
    {
      name: "Bildirim (FCM)",
      ok: !!(env.FCM_PROJECT_ID && env.GOOGLE_SERVICE_ACCOUNT_JSON),
    },
    { name: "Ödeme (Stripe)", ok: !!env.STRIPE_SECRET_KEY },
  ];
}

function buildChecker(env: Env): Checker {
  // Arama = Serper/Tavily. Karar (reasoner): Groq geçici (varsa öncelikli),
  // yoksa DeepSeek (kalıcı). OpenAI yalnız embedding; Gemini bilinçli devre dışı.
  const providers: SearchProvider[] = [];
  if (env.SERPER_API_KEY) providers.push(new SerperSearchProvider(env.SERPER_API_KEY));
  if (env.TAVILY_API_KEY) providers.push(new TavilySearchProvider(env.TAVILY_API_KEY));
  const reasoner = env.GROQ_API_KEY
    ? new GroqEventReasoner(env.GROQ_API_KEY)
    : env.DEEPSEEK_API_KEY
      ? new DeepSeekEventReasoner(env.DEEPSEEK_API_KEY)
      : null;
  if (providers.length > 0 && reasoner) {
    return new LiveChecker(new FallbackSearchProvider(providers), reasoner);
  }
  return new StubChecker();
}

function buildAuthority(env: Env): AuthorityResolver {
  return env.GROQ_API_KEY
    ? new GroqAuthorityResolver(env.GROQ_API_KEY)
    : new NullAuthorityResolver();
}

function buildAssistant(env: Env): IntentAssistant {
  // Niyet asistanı: Groq (varsa) yoksa sezgisel fallback (anahtarsız dev).
  return env.GROQ_API_KEY
    ? new GroqIntentAssistant(env.GROQ_API_KEY)
    : new HeuristicIntentAssistant();
}

function buildNotifier(env: Env): Notifier {
  if (env.FCM_PROJECT_ID && env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return new FcmNotifier(
      env.FCM_PROJECT_ID,
      new GoogleAuthTokenProvider(env.GOOGLE_SERVICE_ACCOUNT_JSON),
    );
  }
  return new NoopNotifier();
}

function buildAuth(env: Env): AuthVerifier {
  return env.SUPABASE_URL ? new SupabaseJwtVerifier(env.SUPABASE_URL) : new DevAuthVerifier();
}

function buildPayment(env: Env): PaymentGateway {
  const appUrl = env.APP_URL ?? `http://localhost:${env.PORT}`;
  if (env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_PRO_MONTH && env.STRIPE_PRICE_PRO_YEAR) {
    return new StripePaymentGateway({
      secretKey: env.STRIPE_SECRET_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET ?? "",
      priceMonth: env.STRIPE_PRICE_PRO_MONTH,
      priceYear: env.STRIPE_PRICE_PRO_YEAR,
      appUrl,
    });
  }
  return new InMemoryPaymentGateway(appUrl);
}

function adminIdsFromEnv(env: Env): ReadonlySet<string> {
  return new Set(
    (env.ADMIN_USER_IDS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
  );
}

/**
 * Composition root (elle DI). Backing service'ler env'den seçilir (12-factor).
 * Repo'lar: SUPABASE_* varsa Supabase; yoksa paylaşılan in-memory store.
 */
export function createContainer(env: Env): Container {
  const checker = buildChecker(env);
  const assistant = buildAssistant(env);
  const authority = buildAuthority(env);
  const notifier = buildNotifier(env);
  const auth = buildAuth(env);
  const payment = buildPayment(env);
  const queue: JobQueue = env.DATABASE_URL
    ? new PgBossJobQueue(env.DATABASE_URL)
    : new InMemoryJobQueue();
  const rateLimit = {
    global: new InMemoryRateLimiter(env.RATE_LIMIT_PER_MINUTE, 60_000),
    createWatch: new InMemoryRateLimiter(env.WATCH_CREATE_PER_HOUR, 3_600_000),
    assist: new InMemoryRateLimiter(env.ASSIST_PER_MINUTE, 60_000),
  };
  const serviceHealth = buildServiceHealth(env);

  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    const db = createSupabaseAdminClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    return {
      topics: new SupabaseCanonicalTopicRepository(db),
      watches: new SupabaseWatchRepository(db),
      monitoring: new SupabaseMonitoringRepository(db),
      devices: new SupabaseDeviceRepository(db),
      subscriptions: new SupabaseSubscriptionRepository(db),
      account: new SupabaseAccountGateway(db),
      prices: new SupabasePriceRepository(db),
      admin: new SupabaseAdminRepository(db),
      adminConsole: new SupabaseAdminConsoleRepository(db),
      analytics: new SupabaseAnalyticsRepository(db),
      support: new SupabaseSupportRepository(db),
      checker,
      assistant,
      authority,
      notifier,
      queue,
      auth,
      payment,
      logger,
      rateLimit,
      serviceHealth,
    };
  }

  const store = new InMemoryStore();
  return {
    topics: new InMemoryCanonicalTopicRepository(store),
    watches: new InMemoryWatchRepository(store),
    monitoring: new InMemoryMonitoringRepository(store),
    devices: new InMemoryDeviceRepository(store),
    subscriptions: new InMemorySubscriptionRepository(store),
    account: new InMemoryAccountGateway(store),
    prices: new InMemoryPriceRepository(store),
    admin: new InMemoryAdminRepository(adminIdsFromEnv(env)),
    adminConsole: new InMemoryAdminConsoleRepository(),
    analytics: new InMemoryAnalyticsRepository(store),
    support: new InMemorySupportRepository(store),
    checker,
    assistant,
    authority,
    notifier,
    queue,
    auth,
    payment,
    logger,
    rateLimit,
    serviceHealth,
  };
}
