# Watcher — Mimari Karar Günlüğü (ADR Log)

> Bu dosya projenin **tüm mimari kararlarının tek doğruluk kaynağıdır.**
> Repo kurulunca `docs/adr/` altına taşınır (istenirse her ADR ayrı `.md` dosyası).
> Her yeni faz kararı buraya eklenir. Format: Nygard ADR + "Değerlendirilen Alternatifler".
> Durum etiketleri: Önerildi · Kabul · Reddedildi · Değiştirildi.

---

## Nasıl çalışıyoruz — Mimari Düşünme Protokolü
- **Kural #1:** Mantık akışı onaylanmadan KOD YOK.
- **Her alt-faz akışı:** `<baglam>` → `<secenekler>` (dahil/hariç gerekçesi) → `<karar>` (ADR) → `<mantik_akisi>` (+ C4 seviyesi) → `<dogrulama>`.
- **Kalibrasyon:** Taktiksel DDD (yalnızca domain çekirdeğinde) · C4 (diyagram) · ADR (karar) · arc42 (opsiyonel şablon). **TOGAF + ISO kurumsal EA = TAM uygulanır** (yöneten çerçeve: `EA-TOGAF-mimari.md`, ADM Preliminary→H). Her değişiklik P1–P9 conformance (§8.2) + değişiklik sınıfı (§9.2) ile denetlenir; Artımlı/Yeniden-mimari kararlar buraya ADR olarak işlenir.
- **Uyulacak standartlar:** OWASP MASVS/ASVS + LLM Top 10 · KVKK · GDPR · WCAG · Google Play Developer Program Policies · 12-Factor · semver.

## Yol Haritası (özet)
Faz 0 Temel & Çerçeve · 1 App Mimarisi · 2 Backend & API · 3 Güvenlik · 4 Gizlilik · 5 Native · 6 AI Karar · 7 Monetizasyon · 8 Test · 9 CI/CD · 10 Observability · 11 Yayın.

**İlerleme:** ADR-001…024 kayıtlı. **Not:** Mimari çalışma `EA-TOGAF-mimari.md` (TOGAF ADM ana süreç) tarafından yönetiliyor; Faz 0–11 yol haritası onun Phase F (Migration Plan) artifact'ı. Bu dosya = Architecture Decision Record (governance altında). Son: ADR-024 (Phase H — feed okundu durumu, migration izni bekliyor).

---

## ADR-001 — Expo CNG + Development Build
- **Durum:** Kabul · Faz 0.1
- **Bağlam:** Zorunlu native özellikler var (WallpaperManager, FCM arka plan data mesajı, exact alarm, bildirim). Expo → APK → Play Store. Solo dev, PC yok (telefon + Oracle VM/RDP).
- **Karar:** Expo **CNG + Development Build**. Native erişim iki kanaldan: **config plugins** (manifest/gradle/izin, build-zamanı) + **local Expo Modules (Kotlin)** (runtime mantık). Build/dağıtım **EAS Build + Submit**; JS-only güncelleme **EAS Update**.
- **Sonuçlar:** Expo Go ile anlık test biter (dev build derlenir); **native değişiklik = yeni binary** (OTA ile geçilemez); EAS free tier kotasına bağımlılık.
- **Mitigasyonlar:** Tek RN/React sürümü; gerekirse pnpm `nodeLinker: hoisted`; resmi Expo+EAS monorepo yapılandırması birebir.
- **Değerlendirilen alternatifler:** Expo Go (native yok → hariç) · Bare RN (elle native bakım yükü, RN yükseltme zorluğu → hariç, kaçış kapısı olarak saklı).

## ADR-002 — Hukuki kapsam: KVKK + GDPR-by-design + Play; PII-siz DeepSeek hattı
- **Durum:** Kabul · Faz 0.2
- **Bağlam:** Geliştirici TR'de, hedef milyon kullanıcı/global. **Kullanıcı verisi DeepSeek (Çin) + arama API'sine gidiyor = sınır ötesi aktarım.** Hesap var (Supabase Auth). Kullanıcı serbest metni PII/hassas veri içerebilir.
- **Karar:** Hukuki taban = **KVKK + GDPR-by-design + Google Play Developer Program Policies.** **DeepSeek/arama hattı tasarım gereği PII'siz:** yalnızca kanonik sorgu + herkese açık arama sonuçları geçer; kullanıcı kimliği veya girdiği PII (piyango no gibi) **asla** gönderilmez.
- **Gerekçe:** KVKK m.9 (7499 s.K., yür. 1 Haz 2024) — 1 Eyl 2024'ten beri rutin (arızi olmayan) aktarımda tek başına açık rıza yeterli değil; Çin için GDPR adequacy kararı yok. PII-sizlik bu sorunu baştan eler ve dedup mimarisiyle örtüşür.
- **Sonuçlar / gereksinimler:** Gizlilik politikası + Play Data Safety formu (zorunlu) + hesap silme URL'si + üçüncü-taraf (Firebase/FCM, Supabase, DeepSeek, arama) açıklamaları. DeepSeek girdileri eğitime kullanırsa "paylaşım" sayılır → no-training/zero-retention tercih (Faz 6).
- **Değerlendirilen alternatifler:** TR-only (global retrofit pahalı → hariç) · gün-1 tam çok-yargı CCPA/LGPD (aşırı → hariç, pazar açıldıkça eklenir).

## ADR-003 — Monorepo: pnpm workspaces + Turborepo
- **Durum:** Kabul · Faz 0.3
- **Bağlam:** Üç deployable (Expo mobil, Render backend, Vercel dashboard) ortak veri sözleşmesini paylaşıyor (PII-sınırı DTO'ları). Solo dev, telefon+VM ortamı.
- **Karar:** **pnpm workspaces + Turborepo** monorepo (byCedric/expo-monorepo-example + create-t3-turbo referans).
  ```
  apps/{mobile, dashboard, backend}
  packages/{contracts, config}   # contracts = PII-sınırı DTO + API sözleşmesi (TEK doğruluk kaynağı)
  turbo.json · pnpm-workspace.yaml · package.json
  ```
- **Hosting:** Vercel monorepo'yu otomatik algılar; her app için Root Directory `apps/<app>` + turbo-ignore. Render: per-service Root Directory `apps/backend`. EAS: resmi monorepo kılavuzu + byCedric metro config.
- **Lisans:** **Proprietary / all-rights-reserved (kapalı kaynak).** Copyleft (GPL/AGPL) bağımlılık yok; üçüncü-taraf lisans attribution manifesti (uygulama içi "açık kaynak lisansları" ekranı); CI'da lisans taraması.
- **İsimlendirme:** paket scope `@<kod-adı>/*`; kebab-case; env `EXPO_PUBLIC_*` / `NEXT_PUBLIC_*`; ana dal `main` + `feature/*`; conventional commits.
- **Sonuçlar:** Sözleşme drift'i imkansız. Ödün: Expo+pnpm keskin kenarları (tek RN sürümü, hoisted, EAS resmi config) + tooling karmaşıklığı. **Kaçış kapısı:** monorepo friction telefon/VM'de çok pahalıya patlarsa → polyrepo + yayınlanan `@scope/contracts`.
- **Değerlendirilen alternatifler:** Polyrepo + yayınlanan contracts (kaçış kapısı) · Nx (ağır/opinionated → hariç).

## ADR-004 — Mobil mimari: feature-sliced + ince 3 katman
- **Durum:** Kabul · Faz 1.1
- **Bağlam:** Asıl iş mantığı backend'de; mobil app çoğunlukla UI + veri çekme + az client mantığı (native orkestrasyon, form, optimistic UI). RN UI ile mantığı birleştirir → katman ayrımı disiplin ister; domain'de aşırı soyutlama perf/yük riski.
- **Karar:** **Feature-sliced organizasyon + feature içi ince 3 katman** (presentation / domain / data). Dependency Rule içe doğru; **domain ince**; use-case + repository **yalnızca karmaşıklığı hak eden akışlarda**.
  ```
  apps/mobile/src/
    app/                       # Expo Router rotaları (ince ekranlar)
    features/{auth, watchers, delivery, billing, settings}/
              { presentation / domain / data }
    components/                # paylaşılan dumb UI (Faz 1.5)
    lib/                       # http client, queryClient, env, native modül wrapper'ları
  ```
  - **presentation:** Expo Router ekranı (ince) + custom hook (view-model) + dumb component.
  - **domain:** (ince) kurallar + tipler (`@watcher/contracts`); karmaşık feature'da use-case + repository *arayüzü*.
  - **data:** API gateway + TanStack Query hook (server-state); karmaşık feature'da repository *implementasyonu* (native modül).
  - **Soyutlama nerede:** `delivery` (bildirim+alarm+duvar kağıdı orkestrasyonu) → tam katmanlama + use-case + repository; `watchers create` → optimistic + validation use-case; `settings`/basit listeler → ince, doğrudan query hook.
- **Mekanik:** absolute path alias (`@/features/...`), barrel/index public API, `../../../` yasak, feature izolasyonu (başka feature'ın iç dosyası import edilmez).
- **Sonuçlar:** Test edilebilir + izole + ceremony yok. Büyürse bazı feature'lar `packages/`'a terfi edebilir.
- **Değerlendirilen alternatifler:** Tam Clean Architecture her feature'da (boilerplate/perf → hariç) · katmansız (çürür → hariç).

## ADR-005 — Mobil state: TanStack Query (server) + Zustand (client) + useState/useReducer (lokal)
- **Durum:** Kabul · Faz 1.2
- **Bağlam:** State'in çoğu server-state (backend watcher'ları, plan/kota, olay geçmişi); UI-state küçük (form, modal, filtre, tema, toggle). Mobil → offline olur. ADR-004 data katmanı zaten TanStack Query.
- **Karar:** **Server verisi YALNIZCA TanStack Query'de** (query key factory, mutation+optimistic+rollback, offline persistence). **Global client-state → Zustand** (persist→MMKV). **Lokal → useState/useReducer**. **DI → Context** (yüksek-frekans değil). **Hassas (token) → expo-secure-store/Keystore** (Faz 3).
- **Sınır kuralı:** Server verisi asla Zustand'a kopyalanmaz; server+client birlikte gerekiyorsa render'da türetilir (stale/sync bug yok).
- **Sonuçlar:** Tek kaynak, az boilerplate, offline-first. Ödün: iki kütüphane (her biri tek işe odaklı); MMKV native → dev build zaten var. Domain use-case'leri state kütüphanesinden bağımsız (test edilebilir).
- **Değerlendirilen alternatifler:** Tek global store/RTK her şeye (verbose, stale UI → hariç; RTK yalnızca devasa senkron client-state için) · sadece useState/useEffect+Context (boilerplate, Context perf → hariç).

## ADR-006 — Navigasyon: Expo Router + Stack.Protected + route groups
- **Durum:** Kabul · Faz 1.3
- **Bağlam:** Expo Router ekranları `app/` içinde olmak zorunda ↔ ADR-004 ekranları `features/` içinde (gerilim). Auth durumu Zustand+secure-store (ADR-005/Faz 3). FCM bildirimi → watcher deep-link (Faz 5). SDK 53+ → Stack.Protected.
- **Karar:** `(auth)`/`(app)` route groups + **Stack.Protected gating** (Zustand auth store'dan beslenir; isLoaded beklenir). **Rotalar ince**, ekranlar `features/*/presentation`'dan render edilir (file-based ↔ feature-slicing köprüsü). **Deep linking + typed routes açık.**
- **Deep link:** built-in; korumalı rotaya deep-link → sign-in. FCM bildirimi rota path taşır → `/watchers/[id]`. Kritik: Expo Router auth sonrası hedefe otomatik dönmez → hedef URL yakalanıp login sonrası navigate edilir.
- **Sonuçlar:** Auth gating tek yerde + deep-link'te de geçerli; thin route. Ödün: SDK 53+ gerekir; bir ekran tek grupta (duplicate yasak).
- **Değerlendirilen alternatifler:** Layout `<Redirect>` (SDK 52 tarzı → yedek, read-only/modal senaryosu) · düz rota ağacı + manuel render (dağınık → hariç).

## ADR-007 — Toolchain: Biome + strict TS + Lefthook
- **Durum:** Kabul (yakın karar) · Faz 1.4
- **Bağlam:** 2026'da ESLint 9 flat config zorunlu; Biome v2.3 olgun (423+ kural, type-aware, react-hooks+a11y, 10-100x hızlı). Stack Expo+Next+TS backend. Solo dev, telefon/VM → hız önemli; az bağımlılık (ASVS) iyi.
- **Karar:** **Biome** (lint+format+import-sort, biome.json) + **strict TypeScript** (tsconfig.base: strict + noUncheckedIndexedAccess, exactOptionalPropertyTypes, verbatimModuleSyntax, isolatedModules…) + **Lefthook** (pre-commit hızlı / pre-push orta / CI tam). Hepsi `packages/config`'ten paylaşılır. **Type-check ayrı kapı** (`tsc --noEmit`; Biome tip kontrolü yapmaz).
- **Sonuçlar:** Tek/hızlı toolchain, az bağımlılık, drift yok. Ödün: Biome Expo resmi `eslint-config-expo`'dan sapar → gerekirse **o app'e scoped thin ESLint kaçış kapısı** (repo geneline değil). Karar yakın: ESLint-first'e tek adımda dönülebilir.
- **Kapı katmanı:** pre-commit (Biome staged + secret-scan) → pre-push (tsc + test) → CI (typecheck + biome ci + test + build, merge bloklar) — Turborepo cache. Detay Faz 9.
- **Değerlendirilen alternatifler:** ESLint9 flat + eslint-config-expo + next + Prettier + Husky (güvenli/konvansiyonel ama yavaş/çok config → ana değil, yedek) · Oxlint+Biome+ESLint hibrit (örtüşen kural gürültüsü → hariç).

## ADR-008 — Tasarım sistemi: NativeWind + tokens + ince erişilebilir primitive'ler
- **Durum:** Kabul · Faz 1.5
- **Bağlam:** Expo stack → Expo-endorsed styling iyi. Monorepo + Next.js dashboard → cross-platform brand tutarlılığı. a11y çekirdek gereç (WCAG, Play). RN component'leri varsayılan anlamsız View → semantik a11y elle. Biome RN-a11y kapsamaz.
- **Karar:** **NativeWind** (build-time, Expo-endorsed; dark: + useColorScheme + Zustand override). **Design tokens** lean `packages/design-tokens` (primitive→semantic→theme light/dark); mobil NativeWind + dashboard Tailwind aynı kaynaktan → tek brand. **Kendi ince dumb primitive'ler** (`components/`), a11y base'e gömülü. Kaçış kapısı: gluestack-ui (a11y-first headless) karmaşık widget için.
- **A11y (temele gömülü):** dokunma hedefi min 44pt/48dp (hitSlop); kontrast AA 4.5:1 (text)/3:1 (UI), renge tek başına güvenme; her interaktif primitive accessibilityRole/Label/State; AccessibilityInfo announce/liveRegion; reduce-motion + modal focus. **eslint-plugin-react-native-a11y → ADR-007 scoped ESLint kaçış kapısının tetikleyicisi.** VoiceOver/TalkBack manuel test (Faz 8.4).
- **Sonuçlar:** Tek brand kaynağı, a11y "default by construction", lean deps. Ödün: NativeWind Unistyles'tan hafif yavaş (ihmal edilebilir); primitive'ler emek (gluestack kaçış kapısı); RN-a11y için ince ESLint.
- **Değerlendirilen alternatifler:** Unistyles 3 (perf++, ama yeni/Expo-endorsed değil/component değil → güçlü alternatif) · Tamagui (ağır kurulum → hariç) · StyleSheet (theming yok → hariç).

---

## ADR-009 — Backend: TypeScript + Hono/Zod, 12-Factor, backend'de DDD/Clean
- **Durum:** Kabul (yakın karar) · Faz 2.1
- **Bağlam:** Backend = **domain çekirdeği** (dedup, AI-karar, zamanlama — ADR-002). Render/Node (edge değil). Monorepo → uçtan uca tip paylaşımı. Solo dev. Faz 2.2 REST+OpenAPI+sürümleme istiyor. Kullanıcı önce Python dedi, tip-paylaşımı gerekçesiyle TS'e döndü; backend ML değil **orkestrasyon** (arama/DeepSeek/FCM çağrıları) → Python'un ML kaldıracı burada yok, TS'in maliyeti yok (kullanıcı ikisinde de güçlü) → tip-paylaşımı kararı TS'e çeviriyor.
- **Karar:** **Dil = TypeScript. Framework = Hono + Zod (@hono/zod-openapi).** Zod şemaları `packages/contracts` (mobil+dashboard+backend tek kaynak) → uçtan uca tip + runtime validation + OpenAPI. **12-Factor iskelet** (config env'de, stateless, log stdout, build/release/run ayrı, health-check, graceful shutdown). **Backend'de tactical DDD/Clean yapı** (domain çekirdeği burada): `src/{domain, application, infrastructure, interfaces, config, main.ts}`. **3 ortam:** dev (local + Supabase dev/branch) · staging (Render staging + Supabase staging) · prod (Render prod + Supabase Pro); per-env secret (Render env groups); **boot'ta Zod env doğrulama → eksikse fail-fast.** Toolchain ADR-007 (Biome + tsconfig `packages/config`).
- **Sonuçlar:** Uçtan uca tip güvenliği (contracts), tek-dil sadelik, lean. İstek akışı: HTTP (Hono) → Zod validate → use-case (application) → domain + infrastructure adapter (Supabase/DeepSeek/search/FCM) → contracts-tipli yanıt. Ödün: Hono "görüşsüz" → scheduling/auth/validation/observability'yi biz kuruyoruz (her parça basit, dedike fazlarda). **Yakın karar: NestJS/Fastify'a tek adımda dönülür.**
- **Değerlendirilen alternatifler:** Fastify (olgun, JSON Schema→OpenAPI, verbose → hariç ama yedek) · NestJS (enterprise/DI/batteries+scheduling ama 3+ takım için; solo-dev'de takım-konvansiyon payoff'u yok, boilerplate → hariç ama yedek) · Express (legacy → hariç).

---

> **Ek not (Supabase tipleri):** Service-role DB erişimi artık `SupabaseClient<Database>` ile tiplenir; `Database` tipi şemadan (0001+0002) elle üretildi — canlı projeye erişim olmadan `supabase gen types typescript` eşdeğeri. Tüm Supabase adapter'ları **cast'siz** (`as` YOK); CHECK kolonları okuma-narrowing gereken yerlerde union olarak modellendi. Sonuç: kolon adı/tip kayması (migration drift) derleme-zamanında yakalanır.

## ADR-010 — İki watcher arketipi + kişisel-değerlendirme yerelde (PII-sınırı uygulaması)
- **Durum:** Kabul · TOGAF Phase C (Faz 2.3 ile ilişkili)
- **Bağlam:** Bazı watch'lar herkes için aynı olayı izler (paylaşılabilir/dedup'lanabilir); bazıları herkese-açık veriyi izler ama "*bana* oldu mu?" değerlendirmesi kişisel veri gerektirir (örn. "piyango *sonucum* çıktı mı"). P1 gereği kişisel veri dış hatta (DeepSeek/arama) **gidemez**.
- **Karar:** İki arketip. **(A) Paylaşılabilir:** tek `CanonicalTopic`, tek arama+muhakeme, paylaşılan `DetectionEvent`, fan-out `Delivery` — tam dedup, PII'siz. **(B) Kişisel-değerlendirilen:** paylaşılan boru hattı yalnızca *herkese açık verinin/olayın mevcudiyetini* tespit eder (PII'siz, dedup'lanabilir); final "bana uyuyor mu?" değerlendirmesi **kullanıcı-kapsamlı / cihaz-üstü** yapılır; kişisel veri (`PersonalCriteria`) cihazda secure-store öncelikli, asla dış hatta gitmez. `Watch.archetype` (A/B) alanı bunu işaretler.
- **Sonuçlar:** PII-sınırı (P1) korunur; dedup ekonomisi B için bile kısmen korunur (paylaşılan tespit). Ödün: B için ekstra istemci-tarafı/yerel değerlendirme mantığı + kişisel verinin güvenli saklanması.
- **Değerlendirilen alternatifler:** Şifreli PII'yi sunucu-değerlendiriciye gönder (P1 ihlal riski/karmaşa → hariç) · tüm değerlendirmeyi sunucuda user-scoped yap (PII sunucuda işlenir, minimizasyon zayıflar → şimdilik hariç; bazı B vakaları için backend user-scoped değerlendirme **kaçış kapısı**).

---

## ADR-011 — İş kuyruğu: pg-boss (Postgres), JobQueue port arkasında
- **Durum:** Kabul · TOGAF Phase C/D (Faz 2.4)
- **Bağlam:** Periyodik kontrol için scheduler + dayanıklı iş kuyruğu gerekir: due topic'leri kuyruğa al → worker arama+muhakeme yürütsün → tespit→fan-out. R1 (maliyet) + P3 (lean/managed) → mümkünse ekstra altyapı (Redis) yok. Stack'te zaten Postgres (Supabase) var; dedup sayesinde iş hacmi benzersiz-konuyla ölçeklenir (mütevazı).
- **Karar:** **Kuyruk = pg-boss (Postgres v12, SKIP LOCKED + LISTEN/NOTIFY).** Bir `JobQueue` **port'u** arkasına alınır: `InMemoryJobQueue` (dev/test, `drain()` ile) + `PgBossJobQueue` (prod). Env-switch: `DATABASE_URL` varsa pg-boss, yoksa in-memory. Scheduler (`runSchedulerTick`) due topic'leri `topic-check` kuyruğuna ekler (prod: Render Cron/interval); worker (`registerMonitoringWorker`) işler → `RunTopicCheck` (checker → CheckRun → tespit varsa DetectionEvent + abonelere fan-out pending Delivery). Due hesabı paylaşılan zonda RPC `topics_due_for_check` (topic'in son kontrolü, aktif watch'ların min frequency'sinden eski mi). `Checker` ayrı port (şimdilik stub; Faz 6: DeepSeek + web araması).
- **Sonuçlar:** Redis yok → bir prodüksiyon parçası eksilir (aynı DB/backup/monitoring). ACID; iş verisiyle aynı transaction. Kuyruk soyut → adapter değişebilir. Ödün: SKIP LOCKED tavanı Redis'in altında (bizim ölçek için yeterli). **Doğrulandı:** in-memory döngü (dedup→scheduler→queue→worker→tespit→fan-out, 9/9 assert) + RPC due-logic (pglite).
- **Değerlendirilen alternatifler:** BullMQ/Redis (yüksek hacim/öncelik/flow ama ekstra altyapı; ölçek dayatırsa **kaçış kapısı** — sadece JobQueue adapter'ı değişir) · Bee-Queue (Redis, basit → hariç) · cloud queue/SQS (stack dışı → hariç) · saf cron/node-schedule (kalıcılık/retry yok → hariç).

---

## ADR-012 — Standartlara uygun abonelik faturalama + admin/analitik
- **Durum:** Kabul · TOGAF Phase C/D (Faz: faturalama+admin)
- **Bağlam:** Free→pro abonelik; admin fiyatları ayarlayabilmeli; **fiyat değişimi mevcut aboneleri dönem bitene kadar etkilememeli** (grandfathering); admin paneli yalnız adminlere; analitik (kaç kullanıcı, hangi abonelik, MRR).
- **Karar:** **Stripe-benzeri model.** (1) **Fiyat kataloğu** `plan_prices` — sürümlenir; bir `(plan, interval)` için kısmi-unique ile **tek aktif** fiyat. Fiyat değişimi = eskiyi pasifle + yeni aktif ekle. (2) **Abonelik** satın alındığı fiyatı `amount_cents` olarak **snapshot**'lar (grandfathering) + `current_period_start/end` + `interval` (month/year) + `cancel_at_period_end`. **Etkin plan** = aktif & dönemi geçmemiş abonelik → plan, yoksa free. (3) **Yenileme** (cron/billing): dönem bitince `cancel_at_period_end` ise iptal; değilse **güncel** fiyatı uygular (grandfathering dönem sonunda biter) ve dönemi uzatır. (4) **Admin** rolü **DB kaynaklı** (`admins` tablosu; dev'de `ADMIN_USER_IDS`), `adminMiddleware` auth'tan sonra `/v1/admin/*`'ı korur; `/v1/me` `isAdmin` döner → UI buton koşulu (istemciye güvenilmez, sunucu zorlar). (5) **Analitik** `/v1/admin/analytics`: totalUsers, free/pro, abonelik (interval kırılımı), watcher sayıları, **MRR** (yıllık /12). Abonelik oluşturma `POST /v1/subscription` gerçek sistemde **ödeme webhook'u** sonrası çağrılır (Stripe vb. ileride).
- **Sonuçlar:** Fiyat değişimi mevcut abonelere dokunmaz; yenilemede güncelle; tam denetlenebilir. Doğrulandı: in-memory 19/19 (grandfathering, yenileme, iptal, analitik, rol) + HTTP (admin-only 403, fiyat 1299→2499'da eski abone 1299 kaldı, yeni 2499).
- **Değerlendirilen alternatifler:** Değişebilir/tek fiyat (grandfathering kırılır → hariç) · admin'i JWT claim'inden türetme (kırılgan, app_metadata gerektirir → DB kaynağı seçildi) · free'yi de abonelik satırı yapma (aktif-abonelik-yokluğu = free seçildi).

---

## ADR-013 — Observability + rate limiting
- **Durum:** Kabul · TOGAF Phase F (operasyon) / ISO 25010 güvenilirlik
- **Bağlam:** Üretim için izlenebilirlik ve kötüye-kullanım/maliyet koruması gerekir. Watcher oluşturma arama + DeepSeek çağrısı tetikleyebilir → paralıdır; korumasız uç maliyeti patlatır.
- **Karar:** (1) **Request-id** her istekte taşınır/üretilir, yanıt başlığına ve loglara yazılır. (2) **Yapılandırılmış JSON log** stdout/stderr'e (12-factor); istek logu metot/yol/durum/süre/kullanıcı/requestId içerir. (3) **Global onError** yakalanmayan hatayı loglar, iç detay sızdırmadan 500 döner. (4) **Rate limiting** `RateLimiter` portu + sabit-pencere in-memory uygulaması; **auth'tan sonra kullanıcı bazlı** uygulanır — global 120/dk (`/v1/*`) + daha sıkı 30/saat (`POST /v1/watchers`). Aşımda `X-RateLimit-*` + `Retry-After` + **429**.
- **Sonuçlar:** İzlenebilir, kötüye-kullanım ve maliyet korumalı. Doğrulandı (HTTP): request-id yansıma/üretim, başlıklar, 429 + Retry-After, kullanıcı izolasyonu, create-limiti 2/saat → 429, JSON loglar.
- **Sınır / not:** In-memory limiter **tek-instance**; çok-instance üretimde paylaşılan store (Redis/Postgres) gerekir → aynı `RateLimiter` portu arkasında değiştirilir (pg-boss desenindeki gibi). Hafif logger tercih edildi (stdout JSON); gerekirse pino vb. ile değiştirilebilir.
- **Değerlendirilen alternatifler:** Rate-limit yokluğu (maliyet/kötüye-kullanım riski → hariç) · IP-bazlı limit (auth-sonrası kullanıcı-bazlı seçildi; adil + sağlık ucu ucuz) · ağır logger bağımlılığı (yalın stdout JSON seçildi).

---

## ADR-014 — Test stratejisi + CI
- **Durum:** Kabul · TOGAF Phase G (yönetişim) / ISO 25010 bakımyapılabilirlik
- **Bağlam:** Şimdiye dek doğrulama ad-hoc script'lerleydi (typecheck + in-memory + pglite + sahte-fetch). Kalıcı regresyon koruması ve otomatik kapı gerekir.
- **Karar:** **Vitest** ile saf domain/application/infra mantığına birim testleri (`apps/backend/test/`): canonicalize (dedup + PII sıyırma + arketip), billing yardımcıları, **grandfathering** (subscribe/setPrice/renew/cancel), plan limitleri (createWatcher), rate limiter. I/O'suz, deterministik, hızlı. **CI** (GitHub Actions): `install --frozen-lockfile` → `biome ci` → `typecheck` (turbo, tüm paketler) → `test` (turbo) → `build` (dashboard). Turbo orkestrasyon.
- **Sonuçlar:** Maliyet-/doğruluk-kritik mantık merge öncesi korunur. Doğrulandı: 22/22 test geçer; pipeline komutları yerelde birebir geçer.
- **Not / kapsam dışı (ileride):** Gerçek Postgres/Supabase entegrasyon testleri (SQL şeması zaten pglite ile ad-hoc doğrulanıyor), mobil/E2E (Detox/Maestro) ve sözleşme testleri sonraki fazlarda.
- **Değerlendirilen alternatifler:** Jest (Vitest seçildi — ESM/TS yerel, hızlı) · test yokluğu (regresyon riski → hariç) · ağır E2E'yi şimdi kurma (çekirdek birim testleri önce; daha yüksek ROI).

---

## Açık Sorular (fazlara taşınan)
- ~~Backend dili: TypeScript mi Python mı?~~ → **çözüldü: TypeScript + Hono/Zod (ADR-009)**
- ~~Scheduler+kuyruk: BullMQ/Redis vs pg-boss/Postgres~~ → **çözüldü: pg-boss (ADR-011)**
- Ürün/marka adı → repo & paket scope finalize
- ~~State yönetimi sınırı~~ → çözüldü (ADR-005)
- MMKV vs AsyncStorage kesin seçimi (perf testiyle) · offline yazma kuyruğu gerekli mi (watcher offline oluşturma) — ileride
- Login-sonrası deep-link hedefine dönüş implementasyonu (FCM bildirimi → watcher) — Faz 5
- Sekme (tab) yapısı kesinleşmesi (kaç tab, hangileri) — UX kararı
- Biome'un Expo/Next-özel kural boşluğu pratikte sorun mu → yakarsa scoped ESLint kaçış kapısı
- Secret-scan aracı seçimi (gitleaks vb.) — Faz 3/9
- gluestack-ui kaçış kapısı gerçekten gerekecek mi · token paketi konumu (packages/design-tokens vs config) · tipografi ölçeği + dynamic type — UX/yapı kararı
- DeepSeek zero-retention/no-training tier/sözleşme — Faz 6
- USE_EXACT_ALARM vs SCHEDULE_EXACT_ALARM — Faz 5
- VERBİS kayıt eşiği (tüzel kişilik kurulunca)
- Veri saklama süreleri — Faz 4
- EAS + pnpm CI son testi + Render build path — Faz 9

## ADR-015 — Kişisel arketip (B): çalışma modeli ve gizlilik

**Bağlam.** Arketip-B (ADR-010) olayın kişiye özel olduğu izlemelerdir. Kriter + değerlendirme PII içerir ve paylaşılan tespit hattına (arama + DeepSeek) ASLA girmemelidir (ADR-002). Soru: B uçtan uca nasıl çalışır?

**Karar.** B iki alt-desene ayrılır:
- **B1 — paylaşılan-olay + cihaz-üstü kişisel filtre (v1 kapsamı).** Olayın çekirdeği kamusal ve dedup'lanabilir (deprem oldu, TK1 rötarlı, BTC fiyatı); kişisel kısım bir filtre/eşiktir (konumuma yakın mı, eşiğimin altında mı, benim uçuşum mu). Backend yalnız **kamusal çekirdeği** tespit eder ve **yapılı `EventFacts`** (geo/numeric/text) fan-out eder. **Cihaz**, kullanıcının gizli `PersonalCriterion`'unu yerelde değerlendirir (`evaluateCriterion`). PII cihazdan asla çıkmaz; dedup/maliyet modeli korunur.
- **B2 — kimlik-doğrulamalı özel kaynak (v1 dışı).** Olay yalnız kullanıcının kimlik bilgisi/PII'siyle özel bir kaynaktan belirlenebilir (kargom geldi mi, maaşım yattı mı). Kamusal çekirdek yoktur → v1 kapsam dışı; ileride cihaz-üstü connector ile çözülür (genişleme noktası açık).

**Gizlilik değişmezi.** Kişisel kriter + değerlendirme **cihazda**. Sunucu: (1) yalnız kamusal çekirdeği tespit eder, (2) yapılı kamusal facts'i teslim eder, (3) kişisel teslimi **data-only (`gate=1`)** gönderir. Cihaz facts'i kritere karşı değerlendirir; eşleşirse yerel bildirim, yoksa sessizce bırakır. `personal_criteria` tablosu v1'de plaintext kriter TUTMAZ; ileride çok-cihaz senkronu için yalnız cihaz anahtarıyla şifreli opak blob saklayabilir (kapsam dışı).

**Mimari sonuç.** Tespit hattı artık ham metin değil **makine-değerlendirilebilir `EventFacts`** üretmelidir. Bu nedenle `ReasonResult`/`CheckOutcome`/`detection_events` `facts` alanı kazandı (migration **0003**); fan-out arketip-farkındadır (`Subscriber.archetype`, `PendingDelivery.archetype`); push `data` `watchId`+`facts` (+personal'de `gate=1`) taşır. Değerlendirici saf mantıktır ve backend↔mobil **birebir** aynadır (`apps/*/.../domain/personal.ts`).

**Sonuçlar.**
- (+) PII cihazdan çıkmadan kişisel izleme; dedup/maliyet korunur; değerlendirici saf + test edilebilir (haversine + eşik + keyword, Türkçe case-folding).
- (+) Kriteri olmayan/parse edilemeyen durumda cihaz fail-open (kullanıcı kaçırmaz).
- (−) **B1 tam dedup'u**, kamusal çekirdeği kişisel filtreden AYIRAN semantik kanonikleştirme gerektirir (DeepSeek, Faz 6). Mevcut sezgisel `canonicalize.ts` kişisel ifadeleri eksik dedup'layabilir ("evime yakın deprem" vs "bölgemde deprem" farklı canonical). Değerlendirici + facts mimarisi bundan **bağımsız** doğrudur; yalnız dedup verimi semantik kanonikleştirmeyle artar.
- (−) FCM mesaj tipi (notification vs data-only) gerçek davranışı container'da doğrulanamaz; `gate=1` + facts data'da taşınır, FCM adapter'ı bunu okuyup data-only göndermelidir (uygulama notu).
- **Doğrulama:** değerlendirici 9 birim testi; tespit→facts→arketip-farkında fan-out 2 entegrasyon testi; 0003 pglite ile doğrulandı; mobil ayna typecheck-temiz.

## ADR-016 — Bildirim & alarm teslim sistemi

**Bağlam.** Olay gerçekleşince kullanıcıya bildirim/alarm gitmeli; teslim biçimi (sessiz/bildirim/alarm) ve alarm sesi kullanıcıya bırakılmalı. Şema'da `deliveries.channel ('push','alarm','wallpaper')` zaten vardı. Hangi planın hangi biçimi açacağı AYRI faz (bilinçli ertelendi).

**Karar — birleşik data-only + cihaz-üstü sunum.** Sunucu olayı tespit edip **data-only** push yollar (`watchId`, `eventId`, olaya-göre `title`/`body`, `facts`, kişiselde `gate=1`). **Cihaz** sunumu kurar: watch başına yerel **uyarı tercihi** (sessiz/bildirim/alarm + sesId) + (kişiselse) kriter kapısı (ADR-015). Hem paylaşılan hem kişisel watch aynı yoldan, tek karar noktasından yönetilir.

**"Gerçekleşti" metni.** `composeEventAlert` (backend, **test edilir**) olaya göre "🔔 \<konu\> — gerçekleşti" başlığı + açıklamayı üretir; push data ile gider, cihaz gösterir.

**Alarm sesi (100).** `tools/gen-alarm-sounds.py` 100 sentetik tonu (7 kategori: Klasik/Dijital/Yükselen/Alçalan/Siren/Darbe/Melodi) `assets/sounds/`'a + tipli `alarm-sounds.ts` kataloğa üretir. Android 8+'da bildirim sesi KANALDAN gelir → seçilen ses için idempotent yüksek-öncelikli kanal (`AndroidImportance.MAX`, `bypassDnd`, custom sound, titreşim). app.json'daki `expo-notifications` plugin'i 100 sesi `res/raw` + iOS Library'e kaydeder (EAS).

**Sonuçlar.**
- (+) Kullanıcı her watch için uyarı biçimi + ses seçer (cihazda); olaya-göre metin; 100 hazır ses.
- (+) Sunum tek yerde (cihaz), paylaşılan/kişisel birleşik; backend metin üreticisi test edilir.
- (−) Mobil sunum runtime'ı container'da doğrulanamaz → typecheck + biome; gerçek davranış EAS derlemesinde.
- (−) Arka planda data-only mesaj + tam-ekran/loop "çalar saat" alarmı native FCM arka-plan handler'ı (TaskManager / setBackgroundMessageHandler) ister — kodda not düşüldü, EAS adımı. Ses önizleme/çalma `expo-audio` ile (sonra).
- (−) Sesler sentetik başlangıç tonu; lisanslı paketlerle değiştirilebilir (generator ile yeniden üretilir).
- **Abonelik-özellik eşlemesi (hangi plan hangi biçimi/sesi açar) AYRI FAZ olarak planlanacak.**

## ADR-017 — Abonelik özellik matrisi (entitlements)

**Bağlam.** Plan başına hangi özelliğin açık olacağı tek yerden tanımlanmalı, hem sunucuda zorlanmalı hem istemciye bildirilmeli. Ancak yeni özelliklerin bir kısmı (alarm biçimi, ses seçimi, kişisel filtre) ADR-015/016 gereği **cihazda** tutuluyor → sunucu bunları görmez, doğrudan zorlayamaz.

**Karar — ikili zorlama modeli + tek kaynak.**
- `PlanEntitlements` (`domain/plan.ts`) **TEK KAYNAK**: `maxActiveWatches`, `minFrequencyMinutes`, `alarmChannel`, `allSounds`, `personalFilters`. `limitsFor` bundan türetilir.
- **Maliyet-getiren alanlar → sunucu-zorunlu:** watch sayısı + sıklık (arama + DeepSeek maliyetini doğrudan etkiler) `createWatcher`'da `PlanLimitError` ile zorlanır. İş modelinin dişleri bunlar.
- **Sunum/cihaz alanları → istemci-gated:** alarm biçimi, ses, kişisel filtre cihazda tutulduğundan sunucu göremez → `/v1/subscription` entitlements'i bildirir, istemci UI'ı buna göre kilitler (🔒 + Pro upsell) ve kilitli değeri kaydetmez.

**Matris (varsayılan; ayarlanabilir).**

| özellik | free | pro |
| --- | --- | --- |
| aktif watch | 3 | 100 |
| min sıklık | 60 dk | 5 dk |
| alarm biçimi (yüksek sesli) | ✕ | ✓ |
| 100 alarm sesi | ✕ (yalnız varsayılan) | ✓ |
| kişisel filtre (arketip-B) | ✕ | ✓ |

**Sonuçlar.**
- (+) Tek kaynak; sunucu maliyet limitlerini zorlar, istemci sunumu gate eder.
- (+) Yeni özellik = entitlements'a bir alan + raporlama + istemci gate.
- (−) Cihaz-side özellikler (alarm/ses/filtre) yalnız istemci-gated → ileri istemci teknik olarak aşabilir; fakat bunlar sunucuya maliyet getirmez (pahalı kısım watch/sıklık ile korunur). Daha sert zorlama istenirse kriter/alarm-config sunucuya taşınmalı (gizlilik/sadelik karşılığı).
- (−) İstemci gating runtime'ı container'da doğrulanmaz → typecheck + biome; gerçek davranış EAS.
- Arketip-B watch'ın free'de sunucu tarafında reddi (kanonikleştirme `personal` dönerse) opsiyon olarak ertelendi (sezgisel sınıflandırma yanlış pozitif verebilir).

## ADR-018 — Plan uzlaştırma (downgrade/upgrade reconciliation)

**Bağlam.** ADR-017 entitlements'i yalnız **oluşturma anında** zorluyordu (createWatcher). Ama abonelik zamanla düşebilir (dönem bitişi). Pro'dayken açılan >limit watch ve <min sıklık, free'ye düşünce kuralı ihlal eder ve pahalı pollingi sürdürür. Stripe webhook'u henüz yok (ödeme en son) → downgrade zaman-temelli.

**Karar — tembel + idempotent uzlaştırma.**
- `reconcilePlan(deps,userId)`: etkin plana göre **en yeni N (=maxActiveWatches) watch aktif**, fazlası **duraklatılır**; aktif sayı limit altındaysa duraklatılmışlar **yeniden aktifleştirilir** (upgrade-resume); aktif watch'ların sıklığı **min altındaysa min'e yükseltilir** (asıl maliyet kaldıracı: 5dk→60dk ≈ 12× tasarruf). Manuel pause özelliği yok → tüm duraklatma sistemcedir, upgrade'de güvenle geri açılır.
- **Tetik:** `getSubscription` başında (tembel). Mobil, abonelik durumunu sık çektiği için (yeni-watch ekranı, abone-olma sonrası) uzlaştırma doğru anlarda çalışır. İdempotent: gerek yoksa hiç yazmaz. (Bilinçli GET yan-etkisi; entitlement uzlaştırmada yaygın desen.)
- **Repo:** `WatchRepository.update(id,{frequencyMinutes?,status?})` eklendi — in-memory **ve** Supabase, ikisi de gerçek (mock değil).
- **Teslim-zamanı backstop (cihaz):** entitlements son çekildiğinde cihazda saklanır; bildirim gelince `notifications.ts` alarm yetkisi düşmüşse alarmı **bildirime indirir** (downgrade'i yansıtır).

**Sonuçlar.**
- (+) Downgrade hem maliyeti (sıklık + duraklatma) hem kuralı uygular; upgrade geri açar. 3 birim test (downgrade / upgrade-resume / idempotent).
- (+) `allSounds` entitlement'i istemcide kablolandı (ses seçici kilitlenir) → artık ölü alan değil.
- (−) Tetik tembel; kullanıcı hiç /v1/subscription çağırmazsa uzlaşma gecikir. Stripe webhook gelince anlık tetik eklenecek; saf periyodik reconcile (tüm kullanıcılar) repo'da "expired sub'lı kullanıcı listesi" ister — ertelendi.
- (−) Cihaz backstop yumuşak (önbellek bayatsa sonraki abonelik çekiminde düzelir) — ADR-016/017 ile tutarlı.

## ADR-019 — Hesap silme (KVKK/GDPR + Play Store şartı)

**Bağlam.** Google Play, kullanıcının hesabını ve verisini **uygulama içinden** silebilmesini zorunlu kılar; KVKK/GDPR de silme/unutulma hakkı gerektirir. Bu olmadan uygulama yayımlanamaz.

**Karar — tek `AccountGateway` portu + cascade.**
- `AccountGateway.deleteAccount(userId)`. İki gerçek impl (12-factor, mock değil):
  - **Supabase:** `auth.admin.deleteUser(userId)` → tüm PII tabloları `ON DELETE CASCADE` (0001_init) ile temizlenir + kimlik silinir. Tek çağrı, tablo adı saymadan, sağlam.
  - **In-memory (dev/test):** store'daki kullanıcı-kapsamlı dizileri (watches/deliveries/deviceTokens/subscriptions) temizler; paylaşılan topic/event'lere dokunmaz.
- Use-case `deleteAccount` → `DELETE /v1/me` (auth) → `{ ok: true }`. İdempotent.
- Mobil: Ayarlar → "tehlikeli bölge" → yıkıcı onay diyaloğu → `DELETE /v1/me` → çıkış.

**Sonuçlar.**
- (+) Play Store in-app silme şartı + KVKK/GDPR silme hakkı karşılandı. 2 birim test (silme + idempotent; başka kullanıcı korunur).
- (+) Denormalize sayaç (ör. subscriber_count) yok → silmede ek bakım gerekmez (dedup paylaşılan canonical_topic ile).
- (−) Supabase silme cascade'e dayanır (PGlite ile doğrulandı: 12 tablo, hepsi auth.users'a cascade). Veri-dışa-aktarma (GDPR erişim hakkı) küçük bir ek olarak ertelendi.
- (−) Mobil akış runtime'ı EAS'te doğrulanır (typecheck + biome burada).

## ADR-020 — Native arka-plan bildirim handler (uygulama kapalı/arka plandayken)

**Bağlam.** Ürünün asıl vaadi "olay olunca haber ver". Foreground listener yalnız uygulama açıkken çalışır → kapalı/arka plandayken de bildirim gerekir. Sunucu data-only FCM gönderir (ADR-016 birleşik tasarım); cihaz sunumu kendisi yapar.

**Karar — `expo-notifications` arka-plan task'ı + kod paylaşımı.**
- `expo-task-manager` eklendi (SDK 53 → 13.1.6). `TaskManager.defineTask(BG_NOTIFICATION_TASK, …)` **modül scope'ta** tanımlanır (headless çalıştırmada da bundle yüklenince çalışır); root `_layout` bu modülü import eder + açılışta `Notifications.registerTaskAsync` çağırır.
- Arka-plan payload'ı `data.dataString` (JSON string) içinde gelir → parse edilip **aynı `handleIncomingData`** ile işlenir (gate + watch-başına alarm-config + downgrade entitlements-backstop + alarm-kanalı/ses). Foreground ve background tek mantık, sıfır tekrar.
- iOS: `app.json` → `ios.infoPlist.UIBackgroundModes = ["remote-notification"]`. Android: expo-notifications eklentisi yeterli (autolink).

**Sonuçlar.**
- (+) Uygulama arka planda/kapalıyken data-only push → cihaz-üstü bildirim/alarm.
- (−) **Doğrulama yalnız typecheck + biome** (Metro/headless container'da koşmaz). Gerçek davranış **EAS development build + cihazda** doğrulanır; `npx expo install expo-task-manager` ile sürüm SDK'ya hizalanmalı.
- (−) **Kilitli ekranda tam-ekran "çalar saat"** (full-screen intent) Expo-managed ötesidir → custom native modül/config plugin ister; v1 dışında ertelendi. Mevcut: yüksek-öncelikli bildirim + özel alarm-kanalı sesi (bypassDnd) ile sesli uyarı.

## ADR-021 — Stripe ödeme (checkout + webhook; gateway-port, 12-factor)

**Bağlam.** Free→pro paraya çevirme. "Ödeme en son" tercihiyle çekirdek + deploy-prep tamamlandıktan sonra eklendi. Fiyatı snapshot'layan `subscribeUser` zaten "webhook sonrası" için tasarlıydı (grandfathering).

**Karar — `PaymentGateway` portu + iki gerçek impl (mock değil).**
- Port: `createCheckout` + `parseWebhook` (ham gövde + imza → normalize `PaymentEvent`: active/canceled/ignored).
  - **Stripe impl:** `stripe.checkout.sessions.create` (mode subscription, `client_reference_id` + `subscription_data.metadata.userId`), `stripe.webhooks.constructEvent` (imza doğrulama); abonelik olaylarında interval fiyat-id'sinden çözülür. Yalnız env'de `STRIPE_SECRET_KEY` + price id'leri varsa seçilir.
  - **In-memory impl (dev/test):** sahte checkout URL; webhook gövdesini JSON olarak okur (imza yok) → tüm handler mantığı testlenebilir.
- Use-case'ler: `startCheckout` (→ URL); `handlePaymentWebhook` (idempotent): aktif → `subscribeUser` + `reconcilePlan`; iptal → status canceled + `reconcilePlan` (free limitine indir).
- Route'lar: `POST /v1/billing/checkout` (authed, `{interval}`→`{url}`); `POST /webhooks/stripe` (**AUTH YOK** — `/v1/*` middleware kapsamı dışında; ham gövde `c.req.text()` + `stripe-signature`; imza geçersiz → 400).
- env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTH/YEAR`, `APP_URL` (hepsi opsiyonel — yoksa in-memory).

**Sonuçlar.**
- (+) Tam akış: checkout → öde → pro; Stripe iptali → free + reconcile. 3 test (checkout URL; aktif→pro+entitlements; iptal→free+fazla watch duraklatma). Webhook idempotent.
- (+) Subscription domain'ine ripple yok; Stripe-özgü kod gateway'de izole.
- (−) Stripe impl doğrulaması **typecheck** (gerçek çağrı/imza canlıda; `stripe` SDK kurulu). Canlıda Stripe CLI ile test et: `stripe listen --forward-to .../webhooks/stripe` → `STRIPE_WEBHOOK_SECRET`'i oradan al.
- (−) **Müşteri portalı (iptal/kart) + Stripe customer-id kalıcılığı bu turda yok** → sonraki Stripe alt-fazı (billing_customers tablosu + portal route). Webhook Stripe-tarafı iptalleri zaten işler.
- (−) **Play Store politikası:** uygulama-içi dijital abonelik için Google Play çoğu durumda Play Billing ister (Stripe değil). Stripe web-checkout "uygulama dışı kullanım"/reader-app istisnalarına göre değerlendirilmeli — ürün/politika kararı.

---

## ADR-022 — Aktivite Akışı (feed) + tespit geri-bildirimi (UserFeedback realize)
- **Durum:** Kabul · TOGAF Phase H (Artımlı) — Phase C'deki `UserFeedback` entity + `RecordFeedback` use-case + VS1/adım-6'yı **gerçekler**.
- **Bağlam:** EA Phase C (§4.1.1/§4.2.5) `UserFeedback` + `RecordFeedback` + VS1 "geri-bildirim" adımını tanımlamıştı ama kod yoktu; `deliveries`+`detection_events` verisi vardı ama kullanıcıya birleşik "ne tespit edildi" akışı olarak sunulmuyordu. `user_feedback` tablosu boştaydı.
- **Karar:** (1) `GET /v1/feed` (authed, **user-scoped**): kullanıcının `deliveries`'i + `detection_events` + `watches` birleştirilip `FeedItem[]` döner. **PII zonu user-scoped; dış hatta egress yok (P1).** (2) `POST /v1/events/{id}/feedback {verdict: correct|incorrect}` → `user_feedback` insert = `RecordFeedback` realize. (3) Şemalar `@watcher/contracts` (`feedItemSchema`, `feedbackInputSchema`) — **P4**. (4) `MonitoringRepository.listFeed` + `recordFeedback` (Supabase **ve** in-memory, ikisi gerçek). (5) Mobil yeni **"Akış"** ana sekmesi + watcher detayında `EventFacts` rozetleri (geo→haritada-aç) + 👍/👎; dashboard **"Akış"** görünümü (KPI + 14 günlük çubuk grafik + tablo).
- **Sonuçlar:** VS1/adım-6 + Teslim görünürlüğü gerçeklendi; `user_feedback` ölü tablo olmaktan çıktı. Feed sorgusu **N+1 değil toplu** (`in()` + map). Ödün: feed user-scoped (admin geneli için ayrı `/v1/admin/system` var); "okundu" durumu (`deliveries.read_at`) migration gerektirdiği için **ertelendi** (ayrı karar/izin).
- **P1–P9 conformance:** P1 ✓ (egress yok, user-scoped) · P2 ✓ (dedup'a dokunmaz; teslim okuması) · P4 ✓ (contracts) · P5 ✓ (auth + RLS `user_feedback`) · P7 ✓ (read_at kaçış kapısı açık) · P8 ✓ (25010 Functional Suitability + Reliability görünürlüğü). Diğerleri etkisiz.
- **Doğrulama:** typecheck + biome + backend test 52/52 + dashboard build; CI yeşil (run #55).
- **Değerlendirilen alternatifler:** feed'i `adminSystem`'e gömme (kullanıcı-dönük değil → hariç) · feedback için yeni tablo (şemadaki `user_feedback` kullanıldı) · feed'e `read_at` okundu-durumu (migration → ertelendi, P7 kaçış kapısı).

---

## ADR-023 — Aydınlık tasarım sistemi "Aurora Day" + token geçişi (ADR-008 genişletme)
- **Durum:** Kabul · TOGAF Phase H (Artımlı) — **ADR-008'i genişletir, supersede etmez** (light/dark token hedefi zaten ADR-008'de vardı).
- **Bağlam:** Uygulanan tek tema koyu "radar/amber"di; ürün sahibi **aydınlık tema + geliştirilmiş görünüm/yerleşim** istedi. ADR-008 zaten "primitive→semantic→theme **light**/dark, tek kaynak" öngörüyordu — bu karar onu light için fiilen uygular.
- **Karar:** **"Aurora Day"** aydınlık paleti **tek kaynaktan**: mobil `tailwind.config` theme token'ları (ink `#F5F7FB` · panel beyaz · accent indigo `#6366F1` + accent2 mor `#8B5CF6` · text slate-900 · muted/pos/neg) **ve** dashboard CSS `:root` değişkenleri **aynı palet**. Sabit-kodlu koyu hex'ler token'a çevrildi. Yeni paylaşılan mobil UI kiti (`Card/Badge/SectionLabel/EmptyState/FactChips`) — **Atomic Design**. Token-bazlı olduğundan tüm ekranlar tek değişiklikle döndü.
- **Sonuçlar:** Tek brand kaynağı (ADR-008 ilkesi) korundu; WCAG 2.2 AA kontrast (slate-900/beyaz, indigo/beyaz). Ödün: **dark-mode şimdilik kapalı** (light-only); ADR-008 light/dark hedefi `useColorScheme` + token theme ile ileride geri açılabilir (**kaçış kapısı**).
- **P1–P9 conformance:** P1 ✓ (salt görsel, egress yok) · P4 ✓ (token tek-kaynak, contracts'a dokunmaz) · P6 ✓ (mobil HIG/dokunma hedefleri korundu) · P8 ✓ (25010 Interaction Capability + WCAG) · P9 ✓ (token disiplini, ceremony yok). Diğerleri etkisiz.
- **Doğrulama:** mobil + dashboard typecheck + biome + build temiz; Vercel deploy.
- **Değerlendirilen alternatifler:** koyu temada kalma (ürün sahibi reddetti) · ekran-ekran elle renk (token yerine → drift riski, hariç) · light+dark ikisini birden (şimdilik light-only; dark ertelendi).

## ADR-024 — Feed "okundu" durumu (deliveries.read_at)
- **Durum:** Kabul — **uygulama hazır (branch); canlı migration 0005 izni bekleniyor** · TOGAF Phase H (Artımlı).
- **Bağlam:** Feed bir gelen-kutusu gibi çalışsın; kullanıcı neyi gördüğünü ayırt etsin ("N yeni", okunmamış vurgusu, "tümünü okundu"). `Delivery` zaten kullanıcı-başına fan-out satırı → okundu durumu onun doğal özelliği (ayrı tablo şişirme).
- **Karar:** `deliveries.read_at timestamptz NULL` (migration **0005**) + kısmi index (`user_id where read_at is null`). `MonitoringRepository.markDeliveryRead` + `markAllRead` (Supabase **ve** in-memory). Uçlar: `POST /v1/feed/{deliveryId}/read`, `POST /v1/feed/read-all`. `FeedItem.readAt` contracts'a eklendi. Mobil: okunmamış vurgusu (accent nokta + kalın + "yeni" rozeti) + açınca/oy verince okundu + "tümünü okundu" (optimistik cache patch). `read_at` user-scoped (RLS + service-role yazar). **Geriye dönük güvenli:** NULL = okunmamış.
- **Deploy-güvenliği:** Kod Supabase'den `read_at` seçtiğinden, **0005 canlıya uygulanmadan main'e merge edilmez** (yoksa prod `/v1/feed` 500). Branch'te bekler.
- **P1–P9 conformance:** P1 ✓ (user-scoped, egress yok) · P4 ✓ (contracts) · P5 ✓ (RLS + service-role yazımı) · P7 ✓ (ayrı tablo kaçış kapısı açık) · P8 ✓ (Interaction Capability — gelen kutusu). Diğerleri etkisiz.
- **Doğrulama:** in-memory 3 test (listFeed okunmamış · markDeliveryRead sahip+izolasyon · markAllRead sayım+idempotent); backend 55/55 + typecheck temiz.
- **Değerlendirilen alternatifler:** ayrı `feed_reads` tablosu (çok-cihaz senkron derdi yoksa gereksiz → hariç) · cihaz-local okundu (çok-cihaz tutarsız → hariç).
