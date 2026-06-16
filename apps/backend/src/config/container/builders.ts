import type { AuthVerifier } from "../../domain/auth";
import type { AuthorityResolver } from "../../domain/authority";
import type { ChannelSender } from "../../domain/channels";
import type { Checker } from "../../domain/checker";
import type { Notifier } from "../../domain/notifier";
import type { PaymentGateway } from "../../domain/payment";
import type { SearchProvider } from "../../domain/search";
import { DevAuthVerifier } from "../../infrastructure/auth/dev.verifier";
import { SupabaseJwtVerifier } from "../../infrastructure/auth/supabase.verifier";
import { ResendEmailSender } from "../../infrastructure/channels/email.sender";
import { TelegramSender } from "../../infrastructure/channels/telegram.sender";
import { WhatsAppSender } from "../../infrastructure/channels/whatsapp.sender";
import { LiveChecker } from "../../infrastructure/checker/live.checker";
import { StubChecker } from "../../infrastructure/checker/stub.checker";
import { InMemoryPaymentGateway } from "../../infrastructure/in-memory/payment.gateway";
import type { SwitchableEventReasoner } from "../../infrastructure/llm/switchable";
import { logger } from "../../infrastructure/logging/logger";
import { FcmNotifier } from "../../infrastructure/notifier/fcm.notifier";
import { NoopNotifier } from "../../infrastructure/notifier/noop.notifier";
import { GoogleAuthTokenProvider } from "../../infrastructure/notifier/token";
import { StripePaymentGateway } from "../../infrastructure/payment/stripe.gateway";
import { FallbackSearchProvider } from "../../infrastructure/search/fallback.search";
import {
  GroqAuthorityResolver,
  NullAuthorityResolver,
} from "../../infrastructure/search/groq.authority";
import { SerperSearchProvider } from "../../infrastructure/search/serper.search";
import { TavilySearchProvider } from "../../infrastructure/search/tavily.search";
import type { Env } from "../env";

/**
 * Env → backing service "fabrika" yardımcıları (ADR-137 — container modülerleştirme). Saf fonksiyonlar;
 * 12-factor: anahtar/yapılandırma yoksa graceful (stub/noop/in-memory). container.ts bunları çağırarak
 * paylaşımlı tekil servisleri kurar. Davranış eski monolitle birebir aynı.
 */

/** Hangi backing servislerin yapılandırıldığı — uydurma sağlık değil, gerçek config. */
export function buildServiceHealth(env: Env): { name: string; ok: boolean }[] {
  return [
    { name: "Veritabanı (Supabase)", ok: !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) },
    { name: "Arama (Serper/Tavily)", ok: !!(env.SERPER_API_KEY || env.TAVILY_API_KEY) },
    { name: "Yapay zekâ (Groq/DeepSeek)", ok: !!(env.GROQ_API_KEY || env.DEEPSEEK_API_KEY) },
    {
      name: "Bildirim (FCM)",
      ok: !!(env.FCM_PROJECT_ID && env.GOOGLE_SERVICE_ACCOUNT_JSON),
    },
    // Ek bildirim kanalları (ADR-154) — diğer servisler gibi gerçek-config sağlığı (kimlik bilgisi var mı).
    { name: "E-posta (Resend)", ok: !!(env.RESEND_API_KEY && env.RESEND_FROM) },
    { name: "Telegram", ok: !!env.TELEGRAM_BOT_TOKEN },
    {
      name: "WhatsApp",
      ok: !!(env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID),
    },
    { name: "Ödeme (Stripe)", ok: !!env.STRIPE_SECRET_KEY },
  ];
}

/**
 * Arama sağlayıcısı (Serper/Tavily) — checker HEM fizibilite ajanı (ADR-129) onu PAYLAŞIR.
 * İkisi de aynı public-web aramasını kullanır; sağlayıcı yoksa null (graceful).
 */
export function buildSearchProvider(env: Env): SearchProvider | null {
  const providers: SearchProvider[] = [];
  if (env.SERPER_API_KEY) providers.push(new SerperSearchProvider(env.SERPER_API_KEY));
  if (env.TAVILY_API_KEY) providers.push(new TavilySearchProvider(env.TAVILY_API_KEY));
  return providers.length > 0 ? new FallbackSearchProvider(providers) : null;
}

export function buildChecker(
  search: SearchProvider | null,
  env: Env,
  reasoner: SwitchableEventReasoner | null,
): Checker {
  // Arama = Serper/Tavily. Karar (reasoner): admin'in seçtiği global model
  // (ADR-095 — Groq/DeepSeek, çağrı anında yönlendirilir). Gemini bilinçli devre dışı.
  if (search && reasoner) {
    return new LiveChecker(
      search,
      reasoner,
      env.RENDER_FETCH_TEMPLATE ?? null,
      env.CHECK_TOKEN_BUDGET ?? null,
      logger,
    );
  }
  return new StubChecker();
}

export function buildAuthority(env: Env): AuthorityResolver {
  return env.GROQ_API_KEY
    ? new GroqAuthorityResolver(env.GROQ_API_KEY)
    : new NullAuthorityResolver();
}

export function buildNotifier(env: Env): Notifier {
  if (env.FCM_PROJECT_ID && env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return new FcmNotifier(
      env.FCM_PROJECT_ID,
      new GoogleAuthTokenProvider(env.GOOGLE_SERVICE_ACCOUNT_JSON),
    );
  }
  return new NoopNotifier(logger);
}

/** Ek teslim kanalları (ADR-084) — yalnız env'i dolu olanlar kurulur (graceful). */
export function buildChannels(env: Env): ChannelSender[] {
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

export function buildAuth(env: Env): AuthVerifier {
  if (env.SUPABASE_URL) return new SupabaseJwtVerifier(env.SUPABASE_URL);
  // ADR-156 (H1): production'da DevAuthVerifier = TAM kimlik-doğrulama bypass'ı (Bearer = userId,
  // imza yok). Env eksikse sessizce sahte doğrulayıcıya düşmek yerine fail-fast (12-factor).
  if (env.NODE_ENV !== "development") {
    throw new Error(
      "Güvenlik: production'da SUPABASE_URL zorunlu — DevAuthVerifier (imzasız) reddedildi.",
    );
  }
  return new DevAuthVerifier();
}

export function buildPayment(env: Env): PaymentGateway {
  const appUrl = env.APP_URL ?? `http://localhost:${env.PORT}`;
  if (env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_PRO_MONTH && env.STRIPE_PRICE_PRO_YEAR) {
    // ADR-156 (C2): canlı ağ geçidi seçildi ama webhook gizi yoksa, Stripe `constructEvent` boş
    // gizle imzayı DOĞRULAR (fail-OPEN) → saldırgan kendi imzasını üretip bedava Pro alır. Fail-fast.
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new Error(
        "Güvenlik: Stripe canlı ağ geçidi için STRIPE_WEBHOOK_SECRET zorunlu — webhook imzası doğrulanamaz (fail-open) → başlatma reddedildi.",
      );
    }
    return new StripePaymentGateway({
      secretKey: env.STRIPE_SECRET_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
      priceMonth: env.STRIPE_PRICE_PRO_MONTH,
      priceYear: env.STRIPE_PRICE_PRO_YEAR,
      appUrl,
    });
  }
  // ADR-156 (H1): InMemoryPaymentGateway imzasız webhook'u KABUL eder → production'da bedava-Pro
  // deliği. Production'da sahte ağ geçidini reddet (gerçek Stripe yapılandırması gerekli).
  if (env.NODE_ENV !== "development") {
    throw new Error(
      "Güvenlik: production'da sahte ödeme ağ geçidi (imzasız webhook kabul eder) reddedildi — Stripe yapılandırması gerekli.",
    );
  }
  return new InMemoryPaymentGateway(appUrl);
}
