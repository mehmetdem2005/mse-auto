import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  // Supabase (yoksa in-memory fallback)
  SUPABASE_URL: z.url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  // pg-boss kuyruğu (yoksa in-memory queue)
  DATABASE_URL: z.string().min(1).optional(),
  // Checker: arama YALNIZ Serper/Tavily (Gemini araması kullanılmaz — kullanıcı kuralı)
  // + reasoner (Groq geçici · DeepSeek kalıcı)
  SERPER_API_KEY: z.string().min(1).optional(),
  TAVILY_API_KEY: z.string().min(1).optional(),
  // JS-render proxy şablonu (ADR-070): "...?api_key=KEY&render_js=true&url={url}"
  RENDER_FETCH_TEMPLATE: z.string().min(1).optional(),
  // Tarama zaman aşımı (ADR-076 A0 guardrail) — asılı checker'ı keser.
  CHECK_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
  // Kontrol başına token bütçesi (ADR-081 A0 guardrail) — aşılırsa eskalasyon turu atlanır.
  CHECK_TOKEN_BUDGET: z.coerce.number().int().positive().optional(),
  GROQ_API_KEY: z.string().min(1).optional(),
  // Model yönlendirme (ADR-078 A5): rol başına model env'den seçilebilir.
  // Boşsa her rol varsayılanı kullanır (llama-3.3-70b-versatile) — davranış değişmez.
  GROQ_REASONER_MODEL: z.string().min(1).optional(),
  GROQ_VERIFIER_MODEL: z.string().min(1).optional(),
  GROQ_ASSISTANT_MODEL: z.string().min(1).optional(),
  DEEPSEEK_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  // Gömme (embedding) sağlayıcıları (ADR-127): Gemini ÜCRETSİZ kota (varsayılan), OpenAI alternatif.
  GEMINI_API_KEY: z.string().min(1).optional(),
  // Sağlayıcı kullanım panosu (ADR-095) — admin "Kaynaklar" kartları; hepsi opsiyonel,
  // tanımsız olan kart dürüstçe "token yok" gösterir.
  SUPABASE_ACCESS_TOKEN: z.string().min(1).optional(), // Management API (sbp_…)
  RENDER_API_KEY: z.string().min(1).optional(), // rnd_… (dashboard → API Keys)
  VERCEL_TOKEN: z.string().min(1).optional(),
  VERCEL_TEAM_ID: z.string().min(1).optional(),
  // FCM push (yoksa NoopNotifier — dev)
  FCM_PROJECT_ID: z.string().min(1).optional(),
  GOOGLE_SERVICE_ACCOUNT_JSON: z.string().min(1).optional(),
  // Ek teslim kanalları (ADR-084) — yoksa o kanal kurulmaz (graceful).
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM: z.string().min(1).optional(), // "Whenly <bildirim@alanadi.com>"
  WHATSAPP_ACCESS_TOKEN: z.string().min(1).optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
  // Onaylı şablon (ADR-106) — pencere dışı uyarı için zorunlu; yoksa serbest-metin (24s) fallback.
  WHATSAPP_TEMPLATE_NAME: z.string().min(1).optional(),
  WHATSAPP_TEMPLATE_LANG: z.string().min(1).optional(), // örn "tr" / "en_US"
  // Dev/in-memory admin kullanıcı id'leri (virgülle). Supabase'de admins tablosu kaynaktır.
  ADMIN_USER_IDS: z.string().optional(),
  // Dashboard CORS — virgülle origin listesi (yoksa tüm origin'lere izin verilir).
  CORS_ORIGINS: z.string().optional(),
  // Stripe ödeme (yoksa in-memory gateway — dev)
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PRICE_PRO_MONTH: z.string().min(1).optional(),
  STRIPE_PRICE_PRO_YEAR: z.string().min(1).optional(),
  APP_URL: z.url().optional(),
  // Rate limit
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(120),
  WATCH_CREATE_PER_HOUR: z.coerce.number().int().positive().default(30),
  // Niyet asistanı (LLM çağrısı) — kullanıcı başına dakikada
  ASSIST_PER_MINUTE: z.coerce.number().int().positive().default(10),
});

export type Env = z.infer<typeof EnvSchema>;

/** 12-factor: env tek noktada, fail-fast doğrulanır. */
export function loadEnv(): Env {
  // Boş string ("") değerleri "tanımsız" say: Render env-group placeholder'ları
  // (örn. FCM_PROJECT_ID="") optional .min(1) alanlarını boşuna patlatmasın.
  const cleaned = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== ""));
  const parsed = EnvSchema.safeParse(cleaned);
  if (!parsed.success) {
    console.error("❌ Geçersiz ortam değişkenleri:", z.flattenError(parsed.error).fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}
