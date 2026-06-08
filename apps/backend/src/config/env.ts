import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  // Supabase (yoksa in-memory fallback)
  SUPABASE_URL: z.url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  // pg-boss kuyruğu (yoksa in-memory queue)
  DATABASE_URL: z.string().min(1).optional(),
  // Checker: arama + DeepSeek (yoksa StubChecker)
  SERPER_API_KEY: z.string().min(1).optional(),
  TAVILY_API_KEY: z.string().min(1).optional(),
  DEEPSEEK_API_KEY: z.string().min(1).optional(),
  // FCM push (yoksa NoopNotifier — dev)
  FCM_PROJECT_ID: z.string().min(1).optional(),
  GOOGLE_SERVICE_ACCOUNT_JSON: z.string().min(1).optional(),
  // Dev/in-memory admin kullanıcı id'leri (virgülle). Supabase'de admins tablosu kaynaktır.
  ADMIN_USER_IDS: z.string().optional(),
  // Stripe ödeme (yoksa in-memory gateway — dev)
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PRICE_PRO_MONTH: z.string().min(1).optional(),
  STRIPE_PRICE_PRO_YEAR: z.string().min(1).optional(),
  APP_URL: z.url().optional(),
  // Rate limit
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(120),
  WATCH_CREATE_PER_HOUR: z.coerce.number().int().positive().default(30),
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
