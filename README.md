# Watcher — Claude Code Devir Notu

AI-destekli olay-izleme uygulaması. Kullanıcı doğal dille "şu olunca haber ver" der; backend periyodik gerçek-internet araması yapar, DeepSeek olay gerçekleşti mi karar verir, gerçekleştiyse FCM push gönderir. Free→pro abonelik. **Dedup iş modelinin kalbi:** aynı konuyu izleyen N kullanıcı = 1 arama + 1 DeepSeek çağrısı + ücretsiz fan-out (paylaşılan `canonical_topic`).

> pnpm + Turborepo monorepo'su, tüm kod TypeScript. **`node_modules` zip'e dahil DEĞİL → `pnpm install` ile kur.**

## Yapı
- **`apps/backend`** — Hono + Zod (`@hono/zod-openapi`). DDD/Clean katmanlar (domain / application / infrastructure / interfaces). Elle DI: `createContainer(env)` backing service'leri **env'den** seçer (12-factor). İki giriş: `src/main.ts` (web) + `src/worker.ts` (kuyruk worker'ları + scheduler tick — ayrı cron gerekmez).
- **`apps/dashboard`** — Vite + React admin paneli (analytics, fiyatlar).
- **`apps/mobile`** — Expo Router (React Native). `(auth)/login` + `(app)/{index,new,settings,subscription}`. Push/alarm: foreground listener + arka-plan task (`expo-task-manager`).
- **`packages/contracts`** — paylaşılan Zod şemaları + tipler. **`packages/config`** — paylaşılan tsconfig/biome.
- **`supabase/migrations`** — `0001_init`, `0002_billing_admin`, `0003_event_facts` (RLS açık; PGlite ile doğrulandı).

## Komutlar
    corepack enable            # pnpm 9.15.9, Node 22
    pnpm install
    pnpm dev                   # tüm app'ler (turbo)
    pnpm typecheck             # 4 paket
    pnpm test                  # backend vitest (50 test)
    pnpm build                 # dashboard
    pnpm biome ci .            # lint/format kontrol
Backend tek başına: `pnpm -F @watcher/backend dev` (web) + `pnpm -F @watcher/backend worker:start` (worker).

## Ortam değişkenleri (12-factor — hepsi opsiyonel)
Hiçbiri yoksa backend **tamamen in-memory/stub** çalışır (tek kod yolu; dev + prod aynı). Her app'te `.env.example` var.
- **backend:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (yoksa in-memory repo) · `DATABASE_URL` (pg-boss; yoksa in-memory kuyruk) · `SERPER_API_KEY`, `TAVILY_API_KEY`, `DEEPSEEK_API_KEY` (yoksa StubChecker) · `FCM_PROJECT_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON` (yoksa NoopNotifier) · `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTH`, `STRIPE_PRICE_PRO_YEAR`, `APP_URL` (yoksa in-memory ödeme) · `ADMIN_USER_IDS` · `RATE_LIMIT_PER_MINUTE`, `WATCH_CREATE_PER_HOUR`.
- **mobile:** `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- **dashboard:** `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Mimari ilkeler
- **Portlar + adaptörler:** Checker (arama+DeepSeek), Notifier (FCM), PaymentGateway (Stripe), AccountGateway (KVKK silme), repolar. Her birinin **gerçek + in-memory** impl'i var (mock değil — env'e göre seçilir).
- **Tespit hattı:** canonicalize → search → DeepSeek reasoner → checker → monitoring → delivery. `EventFacts` makine-değerlendirilebilir.
- **Abonelik:** `subscribeUser` ödeme webhook'u sonrası fiyatı snapshot'lar (grandfathering). `reconcilePlan` downgrade/upgrade'de watch'ları plana uyumlar (ADR-018). Entitlement matrisi tek kaynak (ADR-017): maliyet-getiren limitler **sunucu-sert**, sunum/alarm özellikleri **cihazda gated** + downgrade backstop.
- **Bildirim:** sunucu data-only FCM yollar; cihaz watch-başına tercihe göre sunar (sessiz/bildirim/alarm + özel ses kanalı). Foreground + arka-plan tek `handleIncomingData` mantığı (ADR-016, ADR-020).

## Ne DOĞRULANDI (bu ortamda, gerçekten çalıştırılarak)
`biome ci` temiz · `typecheck` 4/4 · **50 backend testi** (HTTP entegrasyon + ödeme + hesap silme + reconcile + entitlements dahil) · dashboard build · migration'lar PGlite/WASM ile (RLS açık).

## Ne DOĞRULANMADI — canlıda / Claude Code'da yapılacak
**Uygulama HİÇ canlı çalışmadı.** Şunlar yalnız typecheck/yapısal doğrulandı; gerçek davranış canlıda ortaya çıkar:
- Mobil (Metro / EAS build + gerçek cihaz), arka-plan push, kilitli-ekran alarm.
- Supabase / PostgREST uçtan-uca (RLS, gerçek sorgular).
- Stripe gerçek checkout + webhook imzası — `stripe listen --forward-to .../webhooks/stripe` ile test et.
- Gerçek Serper/Tavily araması + DeepSeek kararı + FCM teslimi.

## Sıradaki (öncelik sırası)
1. **`DEPLOY.md`'yi uygula → ilk uçtan-uca canlı koşu** (en kritik de-risk; asıl bilinmeyenler burada çıkar).
2. Stripe **müşteri portalı + customer-id kalıcılığı** (`billing_customers` tablosu + portal route) — şu an YOK.
3. Dashboard entitlements matrisi gösterimi; ses önizleme (expo-audio); `plan_prices` pro fiyatı seed.
4. Full-screen locked alarm (custom native modül — Expo-managed ötesi).
5. (Politika) Uygulama-içi dijital abonelikte Google Play çoğu durumda **Play Billing** ister (Stripe değil) — değerlendir.

## Belgeler
- **`DEPLOY.md`** — adım adım canlıya alma (Supabase → FCM → DeepSeek/Serper → Stripe → Render → Vercel → EAS → duman testi).
- **`docs/mimari-karar-gunlugu.md`** — ADR-001…021 (tüm mimari kararlar + gerekçeler + dürüst sınırlar).
- **`docs/EA-TOGAF-mimari.md`** — Enterprise Architecture (TOGAF).
- Katman README'leri: `apps/backend/src/{domain,application,infrastructure}/README.md`.
