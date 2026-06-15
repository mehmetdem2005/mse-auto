import { z } from "zod";
import { isoTimestamp } from "./common";
import { billingIntervalSchema } from "./subscription";

export const setPriceInputSchema = z.object({
  plan: z.literal("pro"),
  interval: billingIntervalSchema,
  amountCents: z.number().int().min(0),
  currency: z.string().default("usd"),
});
export type SetPriceInput = z.infer<typeof setPriceInputSchema>;

export const adminStatsSchema = z.object({
  totalUsers: z.number().int(),
  freeUsers: z.number().int(),
  proUsers: z.number().int(),
  activeSubscriptions: z.number().int(),
  subscriptionsByInterval: z.object({ month: z.number().int(), year: z.number().int() }),
  totalWatchers: z.number().int(),
  activeWatchers: z.number().int(),
  mrrCents: z.number().int(),
});
export type AdminStats = z.infer<typeof adminStatsSchema>;

// ---- Admin konsolu: kullanıcı / watcher / abonelik / sistem yönetimi ----

export const adminUserSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  createdAt: z.string(),
  isAdmin: z.boolean(),
  plan: z.enum(["free", "pro"]),
  watchCount: z.number().int(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;
export const adminUserListSchema = z.array(adminUserSchema);

export const adminWatchSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userEmail: z.string().nullable(),
  rawIntent: z.string(),
  archetype: z.enum(["shared", "personal"]),
  frequencyMinutes: z.number().int(),
  status: z.enum(["active", "paused"]),
  createdAt: z.string(),
});
export type AdminWatch = z.infer<typeof adminWatchSchema>;
export const adminWatchListSchema = z.array(adminWatchSchema);

export const adminSubscriptionSchema = z.object({
  userId: z.string(),
  userEmail: z.string().nullable(),
  plan: z.string(),
  interval: billingIntervalSchema.nullable(),
  amountCents: z.number().int().nullable(),
  currency: z.string(),
  status: z.string(),
  currentPeriodEnd: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean(),
});
export type AdminSubscription = z.infer<typeof adminSubscriptionSchema>;
export const adminSubscriptionListSchema = z.array(adminSubscriptionSchema);

/** Kullanıcı 360° detayı (ADR-101). */
export const adminUserDetailSchema = adminUserSchema.extend({
  subscription: adminSubscriptionSchema.nullable(),
  watches: z.array(
    z.object({
      id: z.string(),
      rawIntent: z.string(),
      status: z.enum(["active", "paused"]),
      frequencyMinutes: z.number().int(),
      createdAt: z.string(),
    }),
  ),
  channels: z
    .object({
      telegram: z.boolean(),
      email: z.boolean(),
      whatsapp: z.boolean(),
      enabled: z.array(z.string()),
    })
    .nullable(),
  devices: z.array(z.object({ id: z.string(), platform: z.string(), createdAt: z.string() })),
  support: z.object({ open: z.number().int(), total: z.number().int() }),
  banned: z.boolean(),
});
export type AdminUserDetail = z.infer<typeof adminUserDetailSchema>;

/** Operasyon & sağlık (ADR-102). */
export const adminOpsSchema = z.object({
  days: z.number().int(),
  checks: z.object({
    total: z.number().int(),
    detections: z.number().int(),
    detectionRate: z.number(),
    avgConfidence: z.number().nullable(),
    tokensUsed: z.number().int(),
  }),
  deliveries: z.object({
    total: z.number().int(),
    /** Başarı oranı (0-100) = (sent+delivered) / terminal (pending hariç); terminal yoksa null. ADR-142. */
    successRate: z.number().nullable(),
    /** Başarısız teslimat sayısı (status="failed") — eyleme dönük sağlık sinyali. ADR-142. */
    failed: z.number().int(),
    byStatus: z.array(z.object({ key: z.string(), count: z.number().int() })),
    byChannel: z.array(z.object({ key: z.string(), count: z.number().int() })),
  }),
});
export type AdminOps = z.infer<typeof adminOpsSchema>;

/** Gelir & büyüme (ADR-103). */
export const adminGrowthSchema = z.object({
  days: z.number().int(),
  signups: z.array(z.object({ date: z.string(), count: z.number().int() })),
  totalUsers: z.number().int(),
  newUsersInRange: z.number().int(),
  funnel: z.object({
    free: z.number().int(),
    pro: z.number().int(),
    conversionRate: z.number(),
  }),
  churn: z.object({ canceled: z.number().int() }),
  mrrCents: z.number().int(),
});
export type AdminGrowth = z.infer<typeof adminGrowthSchema>;

// ---- Etkileşim & moderasyon (ADR-104) ----

/** Push yayın segmenti: tüm kullanıcılar / yalnız ücretsiz / yalnız pro. */
export const broadcastSegmentSchema = z.enum(["all", "free", "pro"]);
export type BroadcastSegment = z.infer<typeof broadcastSegmentSchema>;

/** Admin push yayını girişi — başlık + metin (FCM bildirim gövdesi sınırlarına yakın). */
export const adminBroadcastInputSchema = z.object({
  title: z.string().min(2).max(80),
  body: z.string().min(2).max(240),
  segment: broadcastSegmentSchema.default("all"),
});
export type AdminBroadcastInput = z.infer<typeof adminBroadcastInputSchema>;

/** Yayın sonucu — kanal pasifse (FCM yok) `channel: "inactive"` ve sayılar 0. */
export const adminBroadcastResultSchema = z.object({
  channel: z.enum(["fcm", "inactive"]),
  segment: broadcastSegmentSchema,
  recipients: z.number().int(),
  sent: z.number().int(),
  failed: z.number().int(),
});
export type AdminBroadcastResult = z.infer<typeof adminBroadcastResultSchema>;

/** Moderasyon: kullanıcı ban/aktif. */
export const adminBanInputSchema = z.object({ banned: z.boolean() });
export type AdminBanInput = z.infer<typeof adminBanInputSchema>;

/** Denetim günlüğü satırı (salt-okunur, değiştirilemez). */
export const adminAuditRowSchema = z.object({
  id: z.string(),
  actorId: z.string(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string().nullable(),
  meta: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string(),
});
export type AdminAuditRow = z.infer<typeof adminAuditRowSchema>;

export const adminAuditListSchema = z.array(adminAuditRowSchema);

// ---- Kanal kullanılabilirliği + e-posta LLM istemi (ADR-107) ----

/** Admin'in açıp kapattığı ek kanal desteği (FCM push her zaman açık, burada yok). */
export const channelAvailabilitySchema = z.object({
  telegram: z.boolean(),
  whatsapp: z.boolean(),
  email: z.boolean(),
});
export type ChannelAvailability = z.infer<typeof channelAvailabilitySchema>;

/** Kullanıcı uygulamasının okuduğu genel yapılandırma (auth'lu, salt-okunur). */
export const appConfigSchema = z.object({ channels: channelAvailabilitySchema });
export type AppConfig = z.infer<typeof appConfigSchema>;

/** Admin e-posta besteci istemi: varsayılan mı kullanılıyor + (özel) istem metni. */
export const emailPromptConfigSchema = z.object({
  useDefault: z.boolean(),
  /** Etkin istem (varsayılan açıksa varsayılan metin; değilse özel metin). */
  prompt: z.string(),
  /** Varsayılan istem metni (UI "varsayılan" toggle'ında kutuya yazılır). */
  defaultPrompt: z.string(),
  persisted: z.boolean(),
});
export type EmailPromptConfig = z.infer<typeof emailPromptConfigSchema>;

/** Admin e-posta istemi güncelleme girişi. */
export const setEmailPromptInputSchema = z.object({
  useDefault: z.boolean(),
  prompt: z.string().max(4000),
});
export type SetEmailPromptInput = z.infer<typeof setEmailPromptInputSchema>;

export const adminSystemSchema = z.object({
  now: z.string(),
  backend: z.string(),
  counts: z.object({
    users: z.number().int(),
    watches: z.number().int(),
    activeWatches: z.number().int(),
    subscriptions: z.number().int(),
    deliveries: z.number().int(),
    checkRuns: z.number().int(),
  }),
  recentCheckRuns: z.array(
    z.object({
      id: z.string(),
      topicId: z.string(),
      ranAt: z.string(),
      decision: z.boolean(),
      confidence: z.number().nullable(),
      summary: z.string().nullable(),
    }),
  ),
  recentDeliveries: z.array(
    z.object({
      id: z.string(),
      status: z.string(),
      channel: z.string(),
      sentAt: z.string().nullable(),
    }),
  ),
  /** Env'den türetilen gerçek servis yapılandırma durumu. */
  services: z.array(z.object({ name: z.string(), ok: z.boolean() })),
});
export type AdminSystem = z.infer<typeof adminSystemSchema>;

// ---- Zaman serisi (istatistik & grafik) ----

/** Bir günün kovası (YYYY-MM-DD, UTC). */
export const adminTimeseriesPointSchema = z.object({
  date: z.string(), // "2026-06-09"
  checkRuns: z.number().int(),
  detections: z.number().int(),
  deliveries: z.number().int(),
});
export type AdminTimeseriesPoint = z.infer<typeof adminTimeseriesPointSchema>;

export const adminTimeseriesSchema = z.object({
  days: z.number().int(),
  points: z.array(adminTimeseriesPointSchema),
  totals: z.object({
    checkRuns: z.number().int(),
    detections: z.number().int(),
    deliveries: z.number().int(),
  }),
});
export type AdminTimeseries = z.infer<typeof adminTimeseriesSchema>;

export const adminTimeseriesQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(14),
});

export const adminIdParamSchema = z.object({ id: z.string().min(1) });
export const setAdminInputSchema = z.object({ makeAdmin: z.boolean() });
export const setWatchStatusInputSchema = z.object({ status: z.enum(["active", "paused"]) });
export const giftProInputSchema = z.object({ interval: billingIntervalSchema });
export type SetAdminInput = z.infer<typeof setAdminInputSchema>;
export type SetWatchStatusInput = z.infer<typeof setWatchStatusInputSchema>;
export type GiftProInput = z.infer<typeof giftProInputSchema>;

// ---- LLM model seçimi (ADR-095) ----
// Admin global modeli seçer; reasoner + verifier + asistan seçili modelle çalışır.

export const llmModelSchema = z.object({
  /** Katalog kimliği: "<provider>/<model>" (örn. "deepseek/deepseek-v4-pro"). */
  id: z.string(),
  provider: z.enum(["groq", "deepseek"]),
  /** Sağlayıcıya giden gerçek model adı. */
  model: z.string(),
  label: z.string(),
  /** Kısa nitelik notu (hız/derinlik) — pazarlama değil, dürüst beklenti. */
  note: z.string(),
  /** API anahtarı env'de tanımlı mı — değilse seçilemez. */
  available: z.boolean(),
});
export type LlmModel = z.infer<typeof llmModelSchema>;

export const llmConfigSchema = z.object({
  /** Aktif katalog kimliği; hiçbir sağlayıcı anahtarı yoksa null. */
  active: z.string().nullable(),
  /** Seçim kalıcı depoda mı (app_settings) — false ise deploy'da sıfırlanır. */
  persisted: z.boolean(),
  models: z.array(llmModelSchema),
});
export type LlmConfig = z.infer<typeof llmConfigSchema>;

export const setLlmModelInputSchema = z.object({ model: z.string().min(1) });
export type SetLlmModelInput = z.infer<typeof setLlmModelInputSchema>;

// ---- Gömme (embedding) sağlayıcı seçimi (ADR-127) — RAG için; LLM modeliyle aynı desen ----
export const embeddingModelSchema = z.object({
  id: z.string(),
  provider: z.enum(["gemini", "openai"]),
  model: z.string(),
  label: z.string(),
  note: z.string(),
  dimensions: z.number().int().positive(),
  available: z.boolean(),
});
export type EmbeddingModel = z.infer<typeof embeddingModelSchema>;

export const embeddingConfigSchema = z.object({
  active: z.string().nullable(),
  persisted: z.boolean(),
  models: z.array(embeddingModelSchema),
});
export type EmbeddingConfig = z.infer<typeof embeddingConfigSchema>;

export const setEmbeddingInputSchema = z.object({ model: z.string().min(1) });
export type SetEmbeddingInput = z.infer<typeof setEmbeddingInputSchema>;

// ---- Sağlayıcı kullanım panosu (ADR-095) ----
// GERÇEK çekilen veri: her kart sağlayıcının kendi API'sinden gelir; token yoksa
// veya uç hata verirse durum DÜRÜSTÇE gösterilir (uydurma metrik yazılmaz).

export const providerMetricSchema = z.object({
  label: z.string(),
  value: z.string(),
  /** Varsa kota/limit bağlamı (örn. "/ 100 GB"). */
  limit: z.string().nullable(),
});
export type ProviderMetric = z.infer<typeof providerMetricSchema>;

export const providerUsageSchema = z.object({
  id: z.enum(["deepseek", "groq", "supabase", "render", "vercel"]),
  name: z.string(),
  /** İlgili token/anahtar env'de tanımlı mı. */
  configured: z.boolean(),
  /** Veri çekimi başarılı mı (configured=false iken her zaman false). */
  ok: z.boolean(),
  metrics: z.array(providerMetricSchema),
  /** configured=false → hangi env eksik; ok=false → uç hatası. */
  error: z.string().nullable(),
  /** Panele gidilecek konsol adresi (dürüst yönlendirme). */
  consoleUrl: z.string(),
  fetchedAt: isoTimestamp,
});
export type ProviderUsage = z.infer<typeof providerUsageSchema>;

export const adminProvidersSchema = z.object({ providers: z.array(providerUsageSchema) });
export type AdminProviders = z.infer<typeof adminProvidersSchema>;
