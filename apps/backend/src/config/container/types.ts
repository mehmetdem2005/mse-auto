import type { EmbeddingRouter } from "../../application/embeddings-config";
import type { LlmModelRouter } from "../../application/llm-config";
import type { TelegramLinkStore } from "../../application/telegram";
import type { AccountGateway } from "../../domain/account";
import type { AiProfileRepository } from "../../domain/ai-profile";
import type { AnnouncementRepository } from "../../domain/announcement";
import type { AuthVerifier } from "../../domain/auth";
import type { AuthorityResolver } from "../../domain/authority";
import type {
  AdminConsoleRepository,
  AdminRepository,
  AnalyticsRepository,
  PriceRepository,
} from "../../domain/billing";
import type { ChannelSender, EmailComposer, UserChannelRepository } from "../../domain/channels";
import type { Checker } from "../../domain/checker";
import type { DeviceRepository } from "../../domain/device";
import type { EmbeddingProvider } from "../../domain/embeddings";
import type { IntentAssistant } from "../../domain/intent-assistant";
import type { Logger } from "../../domain/logger";
import type { ModerationRepository } from "../../domain/moderation";
import type { MonitoringRepository } from "../../domain/monitoring";
import type { Notifier } from "../../domain/notifier";
import type { PaymentGateway } from "../../domain/payment";
import type { CanonicalTopicRepository, WatchRepository } from "../../domain/ports";
import type { ProviderUsagePort } from "../../domain/providers";
import type { JobQueue } from "../../domain/queue";
import type { RagStore } from "../../domain/rag";
import type { RateLimiter } from "../../domain/rate-limit";
import type { SettingsRepository } from "../../domain/settings";
import type { SitePolicyResolver } from "../../domain/site-policy";
import type { SubscriptionRepository } from "../../domain/subscription";
import type { SupportRepository } from "../../domain/support";
import type { TrafficRepository } from "../../domain/traffic";
import type { EventVerifier } from "../../domain/verifier";
import type { TelegramBotApi } from "../../infrastructure/channels/telegram-bot";

/**
 * Composition root sözleşmesi (ADR-137 — container modülerleştirme). Bu arayüz `config/container.ts`
 * tarafından inşa edilir; tüm route/use-case katmanı `import type { Container }` ile buna bağlanır
 * (geriye-uyum için container.ts re-export eder). Saf tip — runtime kodu yok.
 */
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
  /** Telegram bot kontrolü (ADR-153) — webhook yanıtı + getMe + setWebhook; token yoksa null. */
  telegramBot: TelegramBotApi | null;
  /** Telegram tek-kullanımlık bağlama kodu deposu (ADR-153) — bellek-içi (combined process). */
  telegramLinks: TelegramLinkStore;
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
  /** Site izleme politikası çözücü (ADR-128) — robots.txt; ajan `check_site_policy` aracı + fizibilite. */
  sitePolicy: SitePolicyResolver;
  /** RAG bilgi tabanı (ADR-143) — pgvector embeddings deposu; DB/migration yoksa dormant (available=false). */
  rag: RagStore;
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

/** Container içindeki repository alt-kümesi (Supabase / in-memory fabrikaları bunu döndürür). */
export type ContainerRepositories = Pick<
  Container,
  | "topics"
  | "watches"
  | "monitoring"
  | "devices"
  | "subscriptions"
  | "account"
  | "aiProfile"
  | "userChannels"
  | "prices"
  | "admin"
  | "adminConsole"
  | "moderation"
  | "analytics"
  | "support"
  | "announcements"
  | "traffic"
>;
