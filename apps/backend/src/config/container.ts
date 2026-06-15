import {
  checkSitePolicyTool,
  resolveAuthorityTool,
  webSearchTool,
} from "../application/agent/tools";
import { getEffectiveEmailPrompt } from "../application/email-prompt";
import { EmbeddingRouter } from "../application/embeddings-config";
import { LlmModelRouter } from "../application/llm-config";
import type { AgentTool } from "../domain/agent";
import type { EmailComposer } from "../domain/channels";
import type { EmbeddingProvider, EmbeddingProviderId } from "../domain/embeddings";
import type { IntentAssistant } from "../domain/intent-assistant";
import type { JobQueue } from "../domain/queue";
import type { RagStore } from "../domain/rag";
import type { SettingsRepository } from "../domain/settings";
import { HeuristicIntentAssistant } from "../infrastructure/assistant/heuristic.assistant";
import { GeminiEmbeddings } from "../infrastructure/embeddings/gemini.embeddings";
import { OpenAiEmbeddings } from "../infrastructure/embeddings/openai.embeddings";
import { SwitchableEmbedder } from "../infrastructure/embeddings/switchable.embedder";
import { InMemorySettingsRepository } from "../infrastructure/in-memory/settings.repo";
import { AgenticIntentAssistant } from "../infrastructure/llm/agentic-assistant";
import {
  type ActiveModelSource,
  FixedModelSource,
  type ProviderKeys,
  SwitchableAgentChat,
  SwitchableEmailComposer,
  SwitchableEventReasoner,
  SwitchableEventVerifier,
  SwitchableIntentAssistant,
} from "../infrastructure/llm/switchable";
import { logger } from "../infrastructure/logging/logger";
import { HttpProviderUsageService } from "../infrastructure/providers/usage";
import { InMemoryJobQueue } from "../infrastructure/queue/in-memory.queue";
import { PgBossJobQueue } from "../infrastructure/queue/pgboss.queue";
import { NullRagStore } from "../infrastructure/rag/null.store";
import { SupabaseRagStore } from "../infrastructure/rag/pgvector.store";
import { InMemoryRateLimiter } from "../infrastructure/rate-limit/in-memory.limiter";
import { RobotsSitePolicyResolver } from "../infrastructure/search/site-policy";
import { createSupabaseAdminClient } from "../infrastructure/supabase/client";
import { SupabaseSettingsRepository } from "../infrastructure/supabase/settings.repo";
import {
  buildAuth,
  buildAuthority,
  buildChannels,
  buildChecker,
  buildNotifier,
  buildPayment,
  buildSearchProvider,
  buildServiceHealth,
} from "./container/builders";
import { buildInMemoryRepositories, buildSupabaseRepositories } from "./container/repositories";
import type { Container } from "./container/types";
import type { Env } from "./env";

export type { Container };

/**
 * Composition root (elle DI, ADR-137 modülerleştirildi). Backing service'ler env'den seçilir
 * (12-factor). Paylaşımlı tekil servisler burada kurulur (`./container/builders`); repository'ler
 * backing-store'a göre fabrikadan gelir (`./container/repositories`); `Container` sözleşmesi
 * `./container/types`. Davranış eski 487-satırlık monolitle BİREBİR aynı (saf refactor).
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
  // Site-izni çözücü (ADR-128): robots.txt tabanlı; fizibilite ajanı `check_site_policy` ile kullanır.
  const sitePolicy = new RobotsSitePolicyResolver(env.RENDER_FETCH_TEMPLATE ?? null);
  // RAG bilgi tabanı (ADR-143 / M3.1): DB varsa pgvector deposu, yoksa dormant null (graceful).
  const rag: RagStore = db ? new SupabaseRagStore(db) : new NullRagStore();
  // Arama sağlayıcısını checker'dan AYRI kur — hem watcher checker'ı hem fizibilite ajanı (ADR-129) paylaşır.
  const searchProvider = buildSearchProvider(env);
  const reasoner = anyLlm ? new SwitchableEventReasoner(llmRouter, llmKeys) : null;
  const checker = buildChecker(searchProvider, env, reasoner);
  // Doğrulayıcı (ADR-060 A1): LLM anahtarı varsa kur; yoksa undefined → doğrulama atlanır.
  const verifier = anyLlm ? new SwitchableEventVerifier(llmRouter, llmKeys) : undefined;
  const checkTimeoutMs = env.CHECK_TIMEOUT_MS;
  // Resmî kaynak çözücü (ADR-046) — fizibilite ajanı `resolve_authority` aracında da kullanır.
  const authority = buildAuthority(env);
  // Niyet asistanı: LLM anahtarı varsa seçili model; yoksa sezgisel fallback (anahtarsız dev).
  // Dayanıklılık fallback (ADR-118): LLM geçici hatasında (timeout/rate-limit/deploy
  // penceresi) niyet asistanı 503 yerine sezgisel asistanla çalışan bir yanıt döndürür.
  const heuristicAssistant = new HeuristicIntentAssistant();
  // ADR-121: niyet asistanı/ajan SABİT deepseek-v4-pro kullanır (admin modelinden BAĞIMSIZ);
  // deepseek anahtarı yoksa admin router'a düşer (graceful). Reasoner/verifier/e-posta admin'de KALIR.
  const assistantSource: ActiveModelSource = env.DEEPSEEK_API_KEY
    ? new FixedModelSource("deepseek/deepseek-v4-pro")
    : llmRouter;
  // Tek-atış asistanı (ADR-126) — ajan başarısız/parse-fail olursa fallback olarak kullanılır.
  const singleShotAssistant = new SwitchableIntentAssistant(assistantSource, llmKeys);
  // ADR-129: olay-bazlı FİZİBİLİTE ajanı — araçlarla (web_search → resolve_authority →
  // check_site_policy) GERÇEKTEN araştırır, yapısal can/partial/cannot kararı verir. Arama
  // sağlayıcısı yoksa web_search boş döner (graceful); ajan hata/parse-fail'de tek-atışa düşer.
  const agentTools: AgentTool[] = [
    webSearchTool((q) =>
      searchProvider
        ? searchProvider
            .search(q)
            // SearchHit.date: string|null → SearchResultLite.date opsiyonel (yoksa anahtarı atla).
            .then((hits) =>
              hits.map((h) => ({
                title: h.title,
                snippet: h.snippet,
                url: h.url,
                ...(h.date ? { date: h.date } : {}),
              })),
            )
        : Promise.resolve([]),
    ),
    resolveAuthorityTool((t) => authority.resolve(t).then((a) => a.domain)),
    checkSitePolicyTool(sitePolicy),
  ];
  const assistant: IntentAssistant = anyLlm
    ? new AgenticIntentAssistant(
        new SwitchableAgentChat(assistantSource, llmKeys),
        agentTools,
        singleShotAssistant,
      )
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

  // Repository'ler backing-store'a göre TEK fabrikadan (ADR-137 — eski çift nesne-literali kaldırıldı);
  // paylaşımlı tekil servisler üstte kuruldu → ikisi birleştirilip Container yayılır.
  const repositories = db ? buildSupabaseRepositories(db) : buildInMemoryRepositories(env);
  return {
    ...repositories,
    settings,
    channels,
    pushActive,
    embeddingRouter,
    embedder,
    sitePolicy,
    rag,
    checker,
    verifier,
    checkTimeoutMs,
    assistant,
    heuristicAssistant,
    emailComposer,
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
