import { getEffectiveEmailPrompt } from "../application/email-prompt";
import { EmbeddingRouter } from "../application/embeddings-config";
import { LlmModelRouter } from "../application/llm-config";
import type { AccountGateway } from "../domain/account";
import type { AiProfileRepository } from "../domain/ai-profile";
import type { AnnouncementRepository } from "../domain/announcement";
import type { AuthVerifier } from "../domain/auth";
import type { AuthorityResolver } from "../domain/authority";
import type {
  AdminConsoleRepository,
  AdminRepository,
  AnalyticsRepository,
  PriceRepository,
} from "../domain/billing";
import type { ChannelSender, EmailComposer, UserChannelRepository } from "../domain/channels";
import type { Checker } from "../domain/checker";
import type { DeviceRepository } from "../domain/device";
import type { EmbeddingProvider, EmbeddingProviderId } from "../domain/embeddings";
import type { IntentAssistant } from "../domain/intent-assistant";
import type { Logger } from "../domain/logger";
import type { ModerationRepository } from "../domain/moderation";
import type { MonitoringRepository } from "../domain/monitoring";
import type { Notifier } from "../domain/notifier";
import type { PaymentGateway } from "../domain/payment";
import type { CanonicalTopicRepository, WatchRepository } from "../domain/ports";
import type { ProviderUsagePort } from "../domain/providers";
import type { JobQueue } from "../domain/queue";
import type { RateLimiter } from "../domain/rate-limit";
import type { SearchProvider } from "../domain/search";
import type { SettingsRepository } from "../domain/settings";
import type { SubscriptionRepository } from "../domain/subscription";
import type { SupportRepository } from "../domain/support";
import type { TrafficRepository } from "../domain/traffic";
import type { EventVerifier } from "../domain/verifier";
import { HeuristicIntentAssistant } from "../infrastructure/assistant/heuristic.assistant";
import { DevAuthVerifier } from "../infrastructure/auth/dev.verifier";
import { SupabaseJwtVerifier } from "../infrastructure/auth/supabase.verifier";
import { ResendEmailSender } from "../infrastructure/channels/email.sender";
import { TelegramSender } from "../infrastructure/channels/telegram.sender";
import { WhatsAppSender } from "../infrastructure/channels/whatsapp.sender";
import { LiveChecker } from "../infrastructure/checker/live.checker";
import { StubChecker } from "../infrastructure/checker/stub.checker";
import { GeminiEmbeddings } from "../infrastructure/embeddings/gemini.embeddings";
import { OpenAiEmbeddings } from "../infrastructure/embeddings/openai.embeddings";
import { SwitchableEmbedder } from "../infrastructure/embeddings/switchable.embedder";
import { InMemoryAccountGateway } from "../infrastructure/in-memory/account.gateway";
import { InMemoryAdminConsoleRepository } from "../infrastructure/in-memory/admin-console.repo";
import { InMemoryAdminRepository } from "../infrastructure/in-memory/admin.repo";
import { InMemoryAiProfileRepository } from "../infrastructure/in-memory/ai-profile.repo";
import { InMemoryAnalyticsRepository } from "../infrastructure/in-memory/analytics.repo";
import { InMemoryAnnouncementRepository } from "../infrastructure/in-memory/announcement.repo";
import { InMemoryDeviceRepository } from "../infrastructure/in-memory/device.repo";
import { InMemoryModerationRepository } from "../infrastructure/in-memory/moderation.repo";
import { InMemoryMonitoringRepository } from "../infrastructure/in-memory/monitoring.repo";
import { InMemoryPaymentGateway } from "../infrastructure/in-memory/payment.gateway";
import { InMemoryPriceRepository } from "../infrastructure/in-memory/price.repo";
import { InMemorySettingsRepository } from "../infrastructure/in-memory/settings.repo";
import { InMemoryStore } from "../infrastructure/in-memory/store";
import { InMemorySubscriptionRepository } from "../infrastructure/in-memory/subscription.repo";
import { InMemorySupportRepository } from "../infrastructure/in-memory/support.repo";
import { InMemoryCanonicalTopicRepository } from "../infrastructure/in-memory/topic.repo";
import { InMemoryTrafficRepository } from "../infrastructure/in-memory/traffic.repo";
import { InMemoryUserChannelRepository } from "../infrastructure/in-memory/user-channels.repo";
import { InMemoryWatchRepository } from "../infrastructure/in-memory/watch.repo";
import {
  type ActiveModelSource,
  FixedModelSource,
  type ProviderKeys,
  SwitchableEmailComposer,
  SwitchableEventReasoner,
  SwitchableEventVerifier,
  SwitchableIntentAssistant,
} from "../infrastructure/llm/switchable";
import { logger } from "../infrastructure/logging/logger";
import { FcmNotifier } from "../infrastructure/notifier/fcm.notifier";
import { NoopNotifier } from "../infrastructure/notifier/noop.notifier";
import { GoogleAuthTokenProvider } from "../infrastructure/notifier/token";
import { StripePaymentGateway } from "../infrastructure/payment/stripe.gateway";
import { HttpProviderUsageService } from "../infrastructure/providers/usage";
import { InMemoryJobQueue } from "../infrastructure/queue/in-memory.queue";
import { PgBossJobQueue } from "../infrastructure/queue/pgboss.queue";
import { InMemoryRateLimiter } from "../infrastructure/rate-limit/in-memory.limiter";
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
import { SupabaseAiProfileRepository } from "../infrastructure/supabase/ai-profile.repo";
import { SupabaseAnalyticsRepository } from "../infrastructure/supabase/analytics.repo";
import { SupabaseAnnouncementRepository } from "../infrastructure/supabase/announcement.repo";
import { createSupabaseAdminClient } from "../infrastructure/supabase/client";
import { SupabaseDeviceRepository } from "../infrastructure/supabase/device.repo";
import { SupabaseModerationRepository } from "../infrastructure/supabase/moderation.repo";
import { SupabaseMonitoringRepository } from "../infrastructure/supabase/monitoring.repo";
import { SupabasePriceRepository } from "../infrastructure/supabase/price.repo";
import { SupabaseSettingsRepository } from "../infrastructure/supabase/settings.repo";
import { SupabaseSubscriptionRepository } from "../infrastructure/supabase/subscription.repo";
import { SupabaseSupportRepository } from "../infrastructure/supabase/support.repo";
import { SupabaseCanonicalTopicRepository } from "../infrastructure/supabase/topic.repo";
import { SupabaseTrafficRepository } from "../infrastructure/supabase/traffic.repo";
import { SupabaseUserChannelRepository } from "../infrastructure/supabase/user-channels.repo";
import { SupabaseWatchRepository } from "../infrastructure/supabase/watch.repo";
import type { Env } from "./env";

export interface Container {
  topics: CanonicalTopicRepository;
  watches: WatchRepository;
  monitoring: MonitoringRepository;
  devices: DeviceRepository;
  subscriptions: SubscriptionRepository;
  account: AccountGateway;
  /** Kullanıcı-başına AI kişiselleştirme (ADR-113) — asistana enjekte. */
  aiProfile: AiProfileRepository;
  prices: PriceRepository;
  admin: AdminRepository;
  adminConsole: AdminConsoleRepository;
  analytics: AnalyticsRepository;
  support: SupportRepository;
  /** Duyurular (ADR-100) — admin oluşturur, kullanıcı zil ekranında görür. */
  announcements: AnnouncementRepository;
  userChannels: UserChannelRepository;
  channels: ChannelSender[];
  /** Kimliksiz trafik telemetrisi (ADR-091). */
  traffic: TrafficRepository;
  checker: Checker;
  verifier: EventVerifier | undefined;
  checkTimeoutMs: number | undefined;
  assistant: IntentAssistant;
  /** Sezgisel asistan — LLM geçici hatasında dayanıklılık fallback'i (ADR-118). */
  heuristicAssistant: IntentAssistant;
  /** E-posta LLM besteci (ADR-109) — admin-ayarlı istem; LLM yoksa undefined (ham metin). */
  emailComposer: EmailComposer | undefined;
  /** Uygulama-geneli ayarlar (ADR-095) — ilk kullanım: seçili LLM modeli. */
  settings: SettingsRepository;
  /** Admin'in seçtiği global LLM modeli; reasoner/verifier/asistanı sürer (ADR-095). */
  llmRouter: LlmModelRouter;
  /** Gömme (embedding) yönlendiricisi + aktif embedder (ADR-127) — RAG için, admin-seçilebilir. */
  embeddingRouter: EmbeddingRouter;
  embedder: EmbeddingProvider;
  /** Sağlayıcı kullanım panosu (ADR-095) — gerçek API verisi. */
  providerUsage: ProviderUsagePort;
  authority: AuthorityResolver;
  notifier: Notifier;
  /** Moderasyon + denetim günlüğü (ADR-104). */
  moderation: ModerationRepository;
  /** FCM yapılandırıldı mı? false ise push yayını "kanal pasif" döner (ADR-104, dürüst). */
  pushActive: boolean;
  queue: JobQueue;
  auth: AuthVerifier;
  payment: PaymentGateway;
  logger: Logger;
  rateLimit: {
    global: RateLimiter;
    createWatch: RateLimiter;
    assist: RateLimiter;
    telemetry: RateLimiter;
    /** /t için tüm kaynaklar toplamı tavanı — XFF rotasyonuna karşı (ADR-091 güvenlik bulgusu). */
    telemetryGlobal: RateLimiter;
  };
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

function buildChecker(env: Env, reasoner: SwitchableEventReasoner | null): Checker {
  // Arama = Serper/Tavily. Karar (reasoner): admin'in seçtiği global model
  // (ADR-095 — Groq/DeepSeek, çağrı anında yönlendirilir). Gemini bilinçli devre dışı.
  const providers: SearchProvider[] = [];
  if (env.SERPER_API_KEY) providers.push(new SerperSearchProvider(env.SERPER_API_KEY));
  if (env.TAVILY_API_KEY) providers.push(new TavilySearchProvider(env.TAVILY_API_KEY));
  if (providers.length > 0 && reasoner) {
    return new LiveChecker(
      new FallbackSearchProvider(providers),
      reasoner,
      env.RENDER_FETCH_TEMPLATE ?? null,
      env.CHECK_TOKEN_BUDGET ?? null,
      logger,
    );
  }
  return new StubChecker();
}

function buildAuthority(env: Env): AuthorityResolver {
  return env.GROQ_API_KEY
    ? new GroqAuthorityResolver(env.GROQ_API_KEY)
    : new NullAuthorityResolver();
}

function buildNotifier(env: Env): Notifier {
  if (env.FCM_PROJECT_ID && env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return new FcmNotifier(
      env.FCM_PROJECT_ID,
      new GoogleAuthTokenProvider(env.GOOGLE_SERVICE_ACCOUNT_JSON),
    );
  }
  return new NoopNotifier(logger);
}

/** Ek teslim kanalları (ADR-084) — yalnız env'i dolu olanlar kurulur (graceful). */
function buildChannels(env: Env): ChannelSender[] {
  const channels: ChannelSender[] = [];
  if (env.TELEGRAM_BOT_TOKEN) channels.push(new TelegramSender(env.TELEGRAM_BOT_TOKEN));
  if (env.RESEND_API_KEY && env.RESEND_FROM) {
    channels.push(new ResendEmailSender(env.RESEND_API_KEY, env.RESEND_FROM));
  }
  if (env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID) {
    // Onaylı şablon varsa pencere-dışı uyarı için template modu; yoksa serbest-metin (ADR-106).
    const template =
      env.WHATSAPP_TEMPLATE_NAME && env.WHATSAPP_TEMPLATE_LANG
        ? { name: env.WHATSAPP_TEMPLATE_NAME, lang: env.WHATSAPP_TEMPLATE_LANG }
        : null;
    channels.push(
      new WhatsAppSender(env.WHATSAPP_ACCESS_TOKEN, env.WHATSAPP_PHONE_NUMBER_ID, template),
    );
  }
  return channels;
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
  // Supabase istemcisi erkende kurulur: hem repo'lar hem ayar deposu kullanır.
  const db =
    env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
      ? createSupabaseAdminClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
      : null;
  const settings: SettingsRepository = db
    ? new SupabaseSettingsRepository(db)
    : new InMemorySettingsRepository();

  // Global LLM modeli (ADR-095): admin seçer, app_settings'te kalıcı; tüm roller
  // (reasoner + verifier + asistan) çağrı anında aktif modele yönlenir.
  const llmKeys: ProviderKeys = { groq: env.GROQ_API_KEY, deepseek: env.DEEPSEEK_API_KEY };
  const llmRouter = new LlmModelRouter(settings, {
    groq: !!env.GROQ_API_KEY,
    deepseek: !!env.DEEPSEEK_API_KEY,
  });
  const anyLlm = !!(env.GROQ_API_KEY || env.DEEPSEEK_API_KEY);
  // Gömme (embedding) sağlayıcıları (ADR-127) — RAG için; admin-seçilebilir. Anahtar yoksa
  // sağlayıcı kurulmaz (dormant). Gemini ÜCRETSİZ varsayılan; OpenAI alternatif.
  const embedProviders: Partial<Record<EmbeddingProviderId, EmbeddingProvider>> = {};
  if (env.GEMINI_API_KEY) embedProviders.gemini = new GeminiEmbeddings(env.GEMINI_API_KEY);
  if (env.OPENAI_API_KEY) embedProviders.openai = new OpenAiEmbeddings(env.OPENAI_API_KEY);
  const embeddingRouter = new EmbeddingRouter(settings, {
    gemini: !!env.GEMINI_API_KEY,
    openai: !!env.OPENAI_API_KEY,
  });
  const embedder = new SwitchableEmbedder(embeddingRouter, embedProviders);
  const reasoner = anyLlm ? new SwitchableEventReasoner(llmRouter, llmKeys) : null;
  const checker = buildChecker(env, reasoner);
  // Doğrulayıcı (ADR-060 A1): LLM anahtarı varsa kur; yoksa undefined → doğrulama atlanır.
  const verifier = anyLlm ? new SwitchableEventVerifier(llmRouter, llmKeys) : undefined;
  const checkTimeoutMs = env.CHECK_TIMEOUT_MS;
  // Niyet asistanı: LLM anahtarı varsa seçili model; yoksa sezgisel fallback (anahtarsız dev).
  // Dayanıklılık fallback (ADR-118): LLM geçici hatasında (timeout/rate-limit/deploy
  // penceresi) niyet asistanı 503 yerine sezgisel asistanla çalışan bir yanıt döndürür.
  const heuristicAssistant = new HeuristicIntentAssistant();
  // ADR-121: niyet asistanı/ajan SABİT deepseek-v4-pro kullanır (admin modelinden BAĞIMSIZ);
  // deepseek anahtarı yoksa admin router'a düşer (graceful). Reasoner/verifier/e-posta admin'de KALIR.
  const assistantSource: ActiveModelSource = env.DEEPSEEK_API_KEY
    ? new FixedModelSource("deepseek/deepseek-v4-pro")
    : llmRouter;
  const assistant: IntentAssistant = anyLlm
    ? new SwitchableIntentAssistant(assistantSource, llmKeys)
    : heuristicAssistant;
  // E-posta besteci (ADR-109): LLM varsa admin-ayarlı istemle profesyonel e-posta yazar.
  const emailComposer: EmailComposer | undefined = anyLlm
    ? new SwitchableEmailComposer(llmRouter, llmKeys, () => getEffectiveEmailPrompt(settings))
    : undefined;
  const providerUsage = new HttpProviderUsageService({
    deepseekKey: env.DEEPSEEK_API_KEY,
    groqKey: env.GROQ_API_KEY,
    supabaseAccessToken: env.SUPABASE_ACCESS_TOKEN,
    supabaseUrl: env.SUPABASE_URL,
    renderApiKey: env.RENDER_API_KEY,
    vercelToken: env.VERCEL_TOKEN,
    vercelTeamId: env.VERCEL_TEAM_ID,
  });
  const authority = buildAuthority(env);
  const notifier = buildNotifier(env);
  const pushActive = !!(env.FCM_PROJECT_ID && env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const channels = buildChannels(env);
  const auth = buildAuth(env);
  const payment = buildPayment(env);
  const queue: JobQueue = env.DATABASE_URL
    ? new PgBossJobQueue(env.DATABASE_URL)
    : new InMemoryJobQueue(logger);
  const rateLimit = {
    global: new InMemoryRateLimiter(env.RATE_LIMIT_PER_MINUTE, 60_000),
    createWatch: new InMemoryRateLimiter(env.WATCH_CREATE_PER_HOUR, 3_600_000),
    assist: new InMemoryRateLimiter(env.ASSIST_PER_MINUTE, 60_000),
    // Kimliksiz beacon ucu (IP başına) — kötüye kullanım tavanı (ADR-091).
    telemetry: new InMemoryRateLimiter(60, 60_000),
    // Tüm kaynaklar toplamı: XFF rotasyonuyla kova atlatılsa bile DB büyümesi sınırlı kalır.
    telemetryGlobal: new InMemoryRateLimiter(600, 60_000),
  };
  const serviceHealth = buildServiceHealth(env);

  if (db) {
    return {
      topics: new SupabaseCanonicalTopicRepository(db),
      watches: new SupabaseWatchRepository(db),
      monitoring: new SupabaseMonitoringRepository(db),
      devices: new SupabaseDeviceRepository(db),
      subscriptions: new SupabaseSubscriptionRepository(db),
      account: new SupabaseAccountGateway(db),
      aiProfile: new SupabaseAiProfileRepository(db),
      embeddingRouter,
      embedder,
      userChannels: new SupabaseUserChannelRepository(db),
      channels,
      prices: new SupabasePriceRepository(db),
      admin: new SupabaseAdminRepository(db),
      adminConsole: new SupabaseAdminConsoleRepository(db),
      moderation: new SupabaseModerationRepository(db),
      pushActive,
      analytics: new SupabaseAnalyticsRepository(db),
      support: new SupabaseSupportRepository(db),
      announcements: new SupabaseAnnouncementRepository(db),
      traffic: new SupabaseTrafficRepository(db),
      checker,
      verifier,
      checkTimeoutMs,
      assistant,
      heuristicAssistant,
      emailComposer,
      settings,
      llmRouter,
      providerUsage,
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
    aiProfile: new InMemoryAiProfileRepository(),
    embeddingRouter,
    embedder,
    userChannels: new InMemoryUserChannelRepository(store),
    channels,
    prices: new InMemoryPriceRepository(store),
    admin: new InMemoryAdminRepository(adminIdsFromEnv(env)),
    adminConsole: new InMemoryAdminConsoleRepository(),
    moderation: new InMemoryModerationRepository(),
    pushActive,
    analytics: new InMemoryAnalyticsRepository(store),
    support: new InMemorySupportRepository(store),
    announcements: new InMemoryAnnouncementRepository(),
    traffic: new InMemoryTrafficRepository(),
    checker,
    verifier,
    checkTimeoutMs,
    assistant,
    heuristicAssistant,
    emailComposer,
    settings,
    llmRouter,
    providerUsage,
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
