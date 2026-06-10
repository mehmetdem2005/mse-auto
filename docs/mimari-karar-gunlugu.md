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

**İlerleme:** ADR-001…032 kayıtlı. **Not:** Mimari çalışma `EA-TOGAF-mimari.md` (TOGAF ADM ana süreç) tarafından yönetiliyor; Faz 0–11 yol haritası onun Phase F (Migration Plan) artifact'ı. Bu dosya = Architecture Decision Record (governance altında). Son: ADR-028 (Phase H — standart uyum düzeltmeleri).

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
- **Durum:** Kabul — **uygulandı** (migration 0005 canlı Supabase'de doğrulandı: `deliveries.read_at` mevcut) · TOGAF Phase H (Artımlı).
- **Bağlam:** Feed bir gelen-kutusu gibi çalışsın; kullanıcı neyi gördüğünü ayırt etsin ("N yeni", okunmamış vurgusu, "tümünü okundu"). `Delivery` zaten kullanıcı-başına fan-out satırı → okundu durumu onun doğal özelliği (ayrı tablo şişirme).
- **Karar:** `deliveries.read_at timestamptz NULL` (migration **0005**) + kısmi index (`user_id where read_at is null`). `MonitoringRepository.markDeliveryRead` + `markAllRead` (Supabase **ve** in-memory). Uçlar: `POST /v1/feed/{deliveryId}/read`, `POST /v1/feed/read-all`. `FeedItem.readAt` contracts'a eklendi. Mobil: okunmamış vurgusu (accent nokta + kalın + "yeni" rozeti) + açınca/oy verince okundu + "tümünü okundu" (optimistik cache patch). `read_at` user-scoped (RLS + service-role yazar). **Geriye dönük güvenli:** NULL = okunmamış.
- **Deploy-güvenliği:** Kod Supabase'den `read_at` seçtiğinden, **0005 canlıya uygulanmadan main'e merge edilmez** (yoksa prod `/v1/feed` 500). Branch'te bekler.
- **P1–P9 conformance:** P1 ✓ (user-scoped, egress yok) · P4 ✓ (contracts) · P5 ✓ (RLS + service-role yazımı) · P7 ✓ (ayrı tablo kaçış kapısı açık) · P8 ✓ (Interaction Capability — gelen kutusu). Diğerleri etkisiz.
- **Doğrulama:** in-memory 3 test (listFeed okunmamış · markDeliveryRead sahip+izolasyon · markAllRead sayım+idempotent); backend 55/55 + typecheck temiz.
- **Değerlendirilen alternatifler:** ayrı `feed_reads` tablosu (çok-cihaz senkron derdi yoksa gereksiz → hariç) · cihaz-local okundu (çok-cihaz tutarsız → hariç).

## ADR-025 — Canlı tespit sağlayıcıları: Gemini arama + OpenAI tek-anahtar checker
- **Durum:** **Kısmen geri alındı** (kullanıcı kuralı): *"her zaman Serper, asla Gemini araması"* + *"OpenAI yalnız embedding"* → **Gemini arama provider'ı ve OpenAiChecker koddan SİLİNDİ** (ADR-027 + sonrası). Kalan canlı: arama = Serper/Tavily, karar = Groq (geçici) / DeepSeek (kalıcı). Bu kayıt tarihsel.
- **Durum (özgün):** Kabul · TOGAF Phase H (Artımlı) — Faz 6 (AI tespit) sağlayıcı genişlemesi.
- **Bağlam:** `LiveChecker` web araması için **Serper/Tavily** + muhakeme için **DeepSeek** istiyordu; `buildChecker` yalnız Serper/Tavily tanıyordu → bu anahtarlar yoksa **StubChecker** (gerçek arama/karar yok). Eldeki anahtarlar farklı (Gemini, OpenAI).
- **Karar:** İki yeni sağlayıcı, hexagonal port'lara takılı: (1) **`GeminiSearchProvider`** — Gemini + Google Search grounding ile gerçek web araması; `SearchProvider` portu, DeepSeek reasoner ile eşleşir. (2) **`OpenAiChecker`** — OpenAI Responses API + `web_search` aracı; **arama + karar tek çağrı**, ayrı reasoner gerekmez (tek-anahtarlı yol), `Checker` portunu doğrudan uygular. `buildChecker` önceliği: `(Serper|Tavily|Gemini) + DeepSeek` → `LiveChecker`; değilse `OPENAI_API_KEY` → `OpenAiChecker`; değilse `StubChecker`. **P1 korunur:** dış hatta yalnız PII'siz canonical sorgu.
- **Sonuçlar:** Tek funded anahtar (OpenAI) gerçek tespiti açar; Gemini yenilenince arama yolu da çalışır. Ödün: `OpenAiChecker` **canlı doğrulanamadı** (verilen OpenAI anahtarı kotasız → 429); birim testle (mock) doğrulandı, ayrıştırma OpenAI Responses şemasına göre toleranslı (output_text + output[]/message). Gerçek davranış funded anahtarla teyit edilecek.
- **⚠️ KRİTİK işletme notu:** Kod hazır ama PROD'da tespit üretmek için **iki dış koşul** gerekir: (a) Render servisi `start:combined` ile dönmeli (scheduler/worker — şu an 0 check_run), (b) **funded** bir AI anahtarı Render env'ine girilmeli. Sağlanan anahtarların hepsi ölü: Gemini expired · DeepSeek $0 · OpenAI quota · Render API 401.
- **P1–P9:** P1 ✓ (canonical PII'siz) · P3 ✓ (managed AI = buy) · P4 ✓ · P7 ✓ (sağlayıcı-agnostik adaptör, swap kolay) · P8 ✓ (25010 Functional Suitability — tespit). 
- **Doğrulama:** 60/60 test (Gemini parse 2 + OpenAI parse 3 + mevcutlar); typecheck + biome temiz.
- **Değerlendirilen alternatifler:** yalnız Serper/Tavily (kullanıcıda yok) · Gemini'yi hem arama hem reasoner yapmak (ileride; OpenAI tek-anahtar şimdilik yeterli) · DeepSeek (bakiyesiz → şimdilik dışı).

## ADR-026 — Kuyruk işleme hatası düzeltmesi + checker sağlayıcı sadeleştirme
- **Durum:** Kabul · TOGAF Phase H (Basitleştirme — kritik üretim hatası).
- **Bağlam:** Prod'da **0 check_run** (13+ saat, 3 aktif watcher). Render log teşhisi: combined süreç + scheduler çalışıyor ("scheduler: 2 topic kuyruğa alındı" her tick) ama **işler hiç işlenmiyor**. Kök neden: `InMemoryJobQueue.process()` yalnız handler **kaydediyor**; bekleyen işler yalnız `drain()` ile işleniyor ve `drain()` **test-only** — combined süreçte kimse çağırmıyor. Ayrıca bir checker hatası topic'i sonsuz "due" döngüsünde bırakıyordu. Kullanıcı yönlendirmesi: **OpenAI yalnız embedding**, **Gemini değil** → arama Serper, karar DeepSeek.
- **Karar:** (1) `InMemoryJobQueue.enqueue` **otomatik pump** eder (re-entrancy guard'lı; bir handler içinden enqueue dış döngüye bırakılır; handler hatası izole edilir/loglanır). (2) `runTopicCheck` checker hatasında **başarısız CheckRun kaydeder + markTopicChecked** (anti-wedge + gözlemlenebilirlik). (3) `buildChecker` sadeleşti: `(Serper|Tavily) + DeepSeek → LiveChecker`; yoksa `StubChecker`. Gemini provider + OpenAiChecker **detection'dan çıkarıldı** (dosyalar durur, bağlantı kesildi — geri dönülebilir).
- **Sonuçlar:** Motor artık işleri gerçekten işler; CheckRun'lar oluşur (DeepSeek fonlanınca gerçek tespit; fonlanmadan "checker hatası" run'ı görünür → döngünün çalıştığı kanıtlanır). Ödün: in-memory kuyruk **tek-süreç** içindir (render.yaml zaten tek servis); çok-süreç gerekirse pg-boss kaçış kapısı.
- **P1–P9:** P1 ✓ · P3 ✓ · P4 ✓ · P7 ✓ (kuyruk/sağlayıcı adaptör swap) · P8 ✓ (25010 *Reliability* — döngü çalışır + hata-toleransı).
- **Doğrulama:** 60/60 test; typecheck + biome temiz. **Canlı doğrulama:** deploy sonrası DB'de CheckRun belirmesi (bu ADR'nin kabul kriteri).
- **Değerlendirilen alternatifler:** start-workers'da `setInterval` ile periyodik drain (enqueue-pump daha basit + anında) · pg-boss'u prod'a almak (tek serviste gereksiz; Supabase pooler region/format riski — ENOTFOUND tenant hatası gözlendi).

## ADR-027 — Geçici reasoner: Groq (DeepSeek kalıcı)
- **Durum:** Kabul · TOGAF Phase H (Artımlı).
- **Bağlam:** Arama (Serper) çalışıyor; tek eksik **çalışan bir reasoner**. DeepSeek key var ama bakiyesiz (402). Kullanıcı kararı: *"uygulama hazır olana kadar Groq kullan (ücretsiz/hızlı), DeepSeek'e bakiye koyunca kalıcıya o geçer; Groq kalıcı değil."*
- **Karar:** `GroqEventReasoner` (OpenAI-uyumlu `api.groq.com`, `llama-3.3-70b-versatile`, JSON modu) — `EventReasoner` portu. `buildChecker` reasoner seçimi: **`GROQ_API_KEY` varsa Groq, yoksa `DEEPSEEK_API_KEY` → DeepSeek**. Böylece Groq anahtarı kaldırılıp DeepSeek fonlanınca tek env değişikliğiyle kalıcıya döner (kod değişmez).
- **Sonuçlar:** Tek geçerli reasoner anahtarıyla gerçek tespit; sağlayıcı-agnostik (P7). Ödün: Groq geçici (rate-limit/kalıcı değil) — bilinçli; DeepSeek hedef.
- **P1–P9:** P1 ✓ (PII'siz canonical) · P3 ✓ (managed) · P7 ✓ (reasoner swap = env) · P8 ✓ (Functional Suitability).
- **Doğrulama:** 62/62 test (Groq parse + hata). Canlı: geçerli Groq key + deploy sonrası DB'de CheckRun/DetectionEvent.
- **Değerlendirilen alternatifler:** yalnız DeepSeek (bakiyesiz) · OpenAI (embedding'e ayrıldı) · Gemini (devre dışı).

## ADR-028 — Standart uyum düzeltmeleri (a11y · react-query · atomic · font · inline→class)
- **Durum:** Kabul · TOGAF Phase H (Artımlı) — özdenetimde tespit edilen, footer'da beyan edilip fiilen uygulanmayan standartları kapatır (yanlış-uyum borcu).
- **Bağlam:** Footer'larda "WCAG 2.2 AA · ITCSS+CUBE · react-query · self-host font · 8pt" yazılmış ama bir kısmı uygulanmamıştı (kendi "yanlış beyan etme" kuralının ihlali).
- **Karar:** (1) **a11y:** emoji/ikon-buton `accessibilityLabel` (Doğru/Yanlış/haritada-aç), emoji SR'dan gizli; **dokunma hedefleri 44pt**; dashboard `:focus-visible`; **semantik `<table>`** (Carbon) + grafik `role="img"`+`aria-label`. (2) **Kontrast (AA):** `muted` slate-500→**slate-600** (mobil token + `--muted`). (3) **State:** dashboard **tümü react-query** (QueryClientProvider + Feed/Overview/Admin; elle `useEffect`-fetch kaldırıldı). (4) **Atomic Design:** mobil `components/{atoms,molecules}/`. (5) **Font:** dashboard uzak IBM Plex/Archivo → **system-font** (remote bağımlılık yok). (6) **inline→CSS sınıf:** grafik + tablo `styles.css`'e.
- **Sonuçlar:** Beyan-gerçek farkı kapandı; biome ci 195 + 4 paket typecheck + 60+ test yeşil, dashboard build temiz.
- **Bilinçli kalan (footer'da ARTIK abartılmaz):** PRPL/route-lazy-split (mevcut ölçek küçük, tek bundle yeterli) + tam modüler type-scale (kısmen; ad-hoc `text-[11/13/15px]` bazı yerlerde duruyor). Bunlar gelecekte; "uygulandı" diye yazılmayacak.
- **P1–P9:** P8 ✓ (25010 Interaction Capability) · P9 ✓ (gerçek uygulama, ritüel değil).
- **ISO:** 25010 *Interaction Capability* (a11y/WCAG) + *Maintainability* (react-query tek desen, atomic, token) · 9241-110 (öz-betimleyicilik/odak).
- **Değerlendirilen alternatifler:** footer'ı kırpıp standartları uygulamamak (yanlış-beyanı sürdürür → reddedildi) · Admin'i elle-fetch bırakmak (kural ihlali → tümü çevrildi).

## ADR-029 — Material Design 3 gezinme & bileşen sistemi (Google kalitesi)
- **Durum:** Kabul · TOGAF Phase H (Artımlı) — design-standards skill §9–10 (Material gezinme/menü/buton + Button→Router→Endpoint katman sözleşmesi) eklendi ve uygulandı.
- **Bağlam:** "Google kalitesinde" arayüz hedefi. Mevcut dashboard sidebar/buton'lar M3 imzasından (durum-katmanı, aktif gösterge, erişilebilir menü) yoksundu.
- **Karar (Dalga 1 — dashboard + temeller):** (1) **M3 Navigation Rail** — ikon + etiket, **pill aktif gösterge** (secondary-container), `aria-current="page"`, hover/focus **state layer** (`color-mix`). (2) **Erişilebilir Overflow (⋮) menü** bileşeni (`Menu.tsx`): `aria-haspopup="menu"`/`aria-expanded`, `role=menu/menuitem`, **klavye** (↑↓ Home/End Enter **Esc**), dışarı-tıkla-kapat, açılışta menüye / kapanışta tetikleyiciye **odak iadesi**. (3) **Buton hiyerarşisi** filled/**tonal**/outlined/**text** + state layer + ≥40px (CSS). (4) Mobil `Btn` Material `tone` (filled/tonal/outlined/text, geriye-uyumlu). (5) M3 **emphasized easing** (`cubic-bezier(.2,0,0,1)`).
- **Sonuçlar:** Google-benzeri etkileşim + tam erişilebilir menü. Dashboard build temiz; typecheck temiz.
- **Dalga 2 (TAMAMLANDI — mobil M3):** **bottom-nav pill aktif gösterge** (focused → secondary-container, `TabIcon`), **FAB** (birincil "yeni watcher" eylemi; `Fab` atom'u; Feed + Watchers ekranlarında sağ-alt), **sekme sadeleştirme** (6→5 görünür; "Yeni" sekmesi `href:null` → FAB devraldı, `/new` rotadan erişilir). **Navigation Drawer bilinçli KULLANILMADI:** M3 kuralı ≤5 destinasyon → bottom-nav doğru tercih (drawer >5 içindir) — eksik değil, M3-doğru karar.
- **Hâlâ kalan (abartılmaz):** dashboard kademeli (cascading)/context (sağ-tık) menüler — bu projede gereksinim yok; ihtiyaç doğarsa eklenir.
- **P1–P9:** P8 ✓ (25010 Interaction Capability) · P9 ✓ (orantılı; "drawer gereksiz" kararı M3-uyumlu).
- **ISO:** 25010 *Interaction Capability* (M3 gezinme/menü a11y) + *Maintainability* (token/bileşen tek-kaynak) · 9241-110 (öz-betimleyicilik/kullanıcı-kontrolü) · WCAG 2.2 (menü klavye+ARIA).
- **Değerlendirilen alternatifler:** hazır M3 kütüphanesi (MUI/Material Web) — ek bağımlılık + bundle; mevcut token/CSS sistemine kendi ince M3 katmanı tercih edildi (ADR-008 ilkesi).

## ADR-030 — Material motion katmanı + bağlam (context) menüsü
- **Durum:** Kabul · TOGAF Phase H (Artımlı) — "üst düzey" hareket + önceki turda ertelenmeyen context menü.
- **Karar (Dashboard):** (1) Gerçek **Material ripple** — pointer konumundan yayılan dalga, tek `document` delegasyonu (`lib/ripple.ts`), `.btn/.nav/.m3-icon-btn/.m3-menu-item/.tab` hedefleri; `prefers-reduced-motion`'da kapalı. (2) **Fade-through görünüm geçişi** (`view-enter`, view değişiminde remount + 0.32s emphasized easing). (3) **Context (sağ-tık) menü** — feed tablosu satırlarında imleç konumunda `role=menu` + kopyala eylemleri (açıklama/olgu-JSON/watchId), Esc + dışarı-tıkla kapat. **(Mobil):** FAB **bas-küçül** (scale 0.92 + elevation/opacity), **ekran geçişleri** (root fade + watcher detayı `slide_from_right` = M3 shared-axis benzeri).
- **Sonuçlar:** Google-benzeri dokunsal his; dashboard typecheck+build+biome a11y temiz, mobil typecheck temiz.
- **Takip (TAMAMLANDI):** (a) **Mobil reduced-motion gating** — `useReduceMotion` (`AccessibilityInfo.isReduceMotionEnabled` + `reduceMotionChanged` dinleyici); açıkken FAB scale ve ekran geçişleri (`animation:"none"`) kapanır → dashboard + mobil **tam** reduced-motion saygılı. (b) **Kademeli (cascading) alt menü** — feed context menüsünde "Kopyala ▸" üst öğesi + yana açılan alt menü (hover/ArrowRight aç · ArrowLeft/Esc kapat · `aria-haspopup`/`aria-expanded`), kopyalama biçimleri (Açıklama/JSON/ID) altında gruplandı.
- **P1–P9:** P8 ✓ (25010 Interaction Capability) · P9 ✓.
- **ISO:** 25010 *Interaction Capability* + *Performance Efficiency* (ripple delegasyon, GPU transform/opacity) · 9241-110 · WCAG 2.2 (reduced-motion).
- **Değerlendirilen alternatifler:** ağır animasyon kütüphanesi (framer-motion/reanimated layout) — bundle/karmaşıklık; CSS keyframes + ince ripple tercih edildi (ADR-008 lean ilkesi).

## ADR-031 — Dashboard UI test altyapısı (vitest + testing-library) + ripple düzeltmesi
- **Durum:** Kabul · TOGAF Phase H (Artımlı) — ADR-014 test stratejisini **UI katmanına** genişletir; özdenetimde itiraf edilen "UI testi yok" açığını kapatır.
- **Bağlam:** UI "doğrulandı" yalnız typecheck/build'e dayanıyordu. Stop kapısı `turbo run test` çalıştırıyor ama dashboard'da `test` script'i yoktu → UI hiç koşulmuyordu.
- **Karar:** Dashboard'a **vitest (jsdom) + @testing-library/react + user-event** + `vitest.config.ts` + `test` script. → `turbo test` artık **dashboard'u da** koşar (3 katman: pre-commit/CI/Stop hook). Testler: **Menu** (aç/kapa · `aria-haspopup`/`aria-expanded` · Esc · menuitem seçimi+kapanış), **ripple** (eşleşen `.btn` ekler · eşleşmeyen/`disabled` atlar).
- **Bulunan + düzeltilen bug:** `ripple.ts` `window.matchMedia?.("…").matches` — `matchMedia` yoksa (jsdom/eski tarayıcı) `.matches` **crash** ediyordu → `?.matches` (güvenli). (Test yazarken yakalandı.)
- **Sonuçlar:** 4 yeni UI testi; `turbo test` 2 paket (backend 60 + dashboard 4); biome 202 + typecheck 4 temiz.
- **P1–P9:** P8 ✓ (25010 Maintainability + Reliability — regresyon koruması UI'a indi).
- **ISO:** 25010 *Maintainability* + *Functional Suitability* (menü davranışı + ripple test-korumalı) · WCAG (menü a11y testle sabitlendi).
- **Bilinçli kalan:** mobil (RN) UI testi — RN test kurulumu ayrı (jest-native); henüz yok, abartmıyorum.

## ADR-032 — Tek ürün: dashboard kaldırıldı, her şey mobil uygulamada
- **Durum:** Kabul · TOGAF Phase H (Yeniden-mimari/Artımlı — bir deployable elendi) — ürün sahibi kararı.
- **Bağlam:** İki ayrı web/uygulama vardı: `apps/mobile` (Expo/RN — asıl ürün, Android + mobil-web aynı koddan) ve `apps/dashboard` (Vite/React — ayrı web paneli). **İkisinde de Akış + admin** vardı → tam duplikasyon (DRY/Maintainability ihlali). Ürün sahibi: "asıl ürün mobil (Android olacak olan); admin de orada olsun; dashboard'ı mobile taşı." Mobil zaten admin dahil tüm ekranlara sahip (react-query + tam özellik) → dashboard işlevsel olarak gereksiz; mobil-web (Expo export) tarayıcı erişimini zaten karşılıyor.
- **Karar:** **`apps/dashboard` tamamen kaldırıldı** (kod + Vercel deploy adımları). Tek istemci ürün = **mobil** (Android via EAS + mobil-web via Expo export). Backend/contracts değişmedi. `pnpm-lock` güncellendi (frozen-install temiz). Admin **yalnız mobilde** (`app/(app)/admin.tsx`, react-query, 5 sekme).
- **Sonuçlar:** Duplikasyon bitti; bakım tek yerde; tek istemci kod tabanı. Ödün: dashboard'a özgü web cilaları (M3 nav-rail, erişilebilir overflow/cascading menü, ripple, UI testleri) elendi — git geçmişinde duruyor; mobil tarafta gerektiğinde RN karşılıkları yapılır. Doğrulama: biome 179 + typecheck 3 paket + test (backend 60) temiz; `pnpm install --frozen-lockfile` temiz.
- **Takip — mobil admin kalite yükseltmesi (dashboard imzası RN'e):** **skeleton (pulse) yükleme** (`Loading`→`Skeleton`, reduce-motion'da sabit), **`Stat` sayaç animasyonu** (`useCountUp`, reduce-motion'da anında) + **tone** (pro=accent · aktif/MRR=pos) + M3 kart gölgesi. Özellikler zaten eşitti (5 sekme + tüm işlemler + fiyatlandırma, react-query); fark görsel kaliteydi → kapandı.
- **P1–P9:** P3 ✓ (gereksiz yüzey elendi) · P7 ✓ (git geçmişinden geri alınabilir) · P8 ✓ (25010 *Maintainability* — tek admin/tek istemci) · P9 ✓ (sağ-boyut).
- **ISO:** 25010 *Maintainability* (duplikasyon kaldırıldı) · 42010 (uygulama bileşeni envanteri sadeleşti).
- **Değerlendirilen alternatifler:** dashboard'da admin tutup mobilden kaldırmak (ürün sahibi mobil-merkezli istedi → reddedildi) · iki admin'i de bırakmak (DRY ihlali sürer → reddedildi).

## ADR-033 — Admin "İstatistik & Grafik" sekmesi (zaman serisi)
- **Durum:** Kabul · TOGAF Phase B/C/D (Data + Application — yeni okuma yüzeyi) — ürün sahibi: "istatistik ve grafik sayfası ekle admine".
- **Bağlam:** Mobil admin'de yalnız anlık sayaçlar (totaller) vardı; **trend (zaman içinde değişim)** görünmüyordu. Silinen dashboard'daki `DayChart` web (SVG) idi → mobile birebir taşınamaz. `check_runs.ran_at` ve `deliveries.sent_at` zaten kayıtlı ham veri boşta duruyordu.
- **Karar:** Uçtan uca **günlük zaman serisi**: (1) sözleşme `adminTimeseriesSchema` (`points[]` + `totals`, gün kovaları YYYY-MM-DD UTC); (2) port `AdminConsoleRepository.getTimeseries(days)`; (3) Supabase impl `check_runs.ran_at`+`decision` (tespit ⊆ kontrol) ve `deliveries.sent_at`'i `gte(since)` ile çekip JS'te kovalıyor; in-memory impl boş kovalar; (4) route `GET /v1/admin/timeseries?days=7|14|30` (zod `coerce`, 1–90 sınırı); (5) mobilde yeni **"İstatistik"** sekmesi: aralık seçici (radiogroup) + **RN View tabanlı bindirmeli sütun grafik** (`BarChart`, reanimated yerine `Animated` yükseklik, reduce-motion'da sabit, her sütun `accessibilityLabel`'lı) + legend + tespit oranı.
- **Sonuçlar:** Boştaki ham veri görselleşti; web-only grafik bağımlılığı yok (saf RN, Android+web aynı kod). Ölçek: sınır-dışı gün (saat dilimi) güvenli atlanıyor; eksen etiketleri ~7'ye seyreltiliyor. Doğrulama: typecheck 3 paket + biome temiz + backend test 61 (yeni timeseries endpoint testi dahil).
- **P1–P9:** P1 ✓ (ham veriden türev, yeni PII yok) · P5 ✓ (a11y: radiogroup/radio + sütun etiketleri) · P8 ✓ (25010 *Performance Efficiency* — tek `gte` sorgu/seri, head'siz minimal kolon) · P9 ✓.
- **ISO:** 25010 *Functional Suitability* (yöneticiye trend içgörüsü) + *Performance Efficiency* (minimal sorgu) · 25012 (veri: gün kovası türetimi UTC tutarlı) · 9241 (etkileşim: aralık seçici, okunur eksen) · 42010 (yeni okuma görünümü envantere eklendi).
- **Değerlendirilen alternatifler:** ayrı `detection_events` tablosundan tespit saymak (ekstra sorgu; `check_runs.decision` zaten yeterli → reddedildi) · grafik kütüphanesi (victory-native/svg — bundle + web/native ayrışması → reddedildi, saf View tercih) · backend'de SQL `date_trunc` agregasyonu (RPC/migration gerektirir; veri hacmi düşük, JS kovalama yeterli → şimdilik reddedildi).

## ADR-034 — Lighthouse denetimi sonrası a11y/SEO düzeltmeleri
- **Durum:** Kabul · TOGAF Phase G/H (Uygulama Yönetişimi — ölçüm-güdümlü düzeltme) — ürün sahibi: "gerçek bir UI test skoru sitesinden tara".
- **Bağlam:** Canlı mobil-web'e (`watcher-app-inky.vercel.app/login`) karşı **gerçek Lighthouse** (Playwright Chromium) koşuldu: Performans **78** · Erişilebilirlik **95** · En İyi Pratik **100** · SEO **82** (LCP 3.6s, CLS 0). Üç gerçek bulgu: (a11y) `label` — RN `Text` etiketi web'de `<label>` üretmiyor; (SEO) `meta-description` yok; (SEO) `robots.txt` geçersiz (SPA rewrite index.html döndürüyor).
- **Karar:** (1) **`Field` atomunu** genelleştirdik: etiketi `cloneElement` ile içteki kontrole `accessibilityLabel` (web'de `aria-label`) olarak enjekte eder → **tüm formlar** tek noktadan WCAG-uyumlu (doğru irtifa, per-input bandaj değil). (2) **`public/robots.txt`** eklendi — Vercel statik dosyayı rewrite'tan önce sunar (doğrulandı: canlıda HTTP 200 text/plain). (3) **SEO meta**: `app/+html.tsx` `output:'single'` export'ta onurlandırılmadı (canlıda lang=en, meta yok) → **CI'da export sonrası `dist/index.html`'e deterministik enjeksiyon** (lang=tr + description + OG); ölü `+html.tsx` kaldırıldı.
- **Sonuçlar:** robots ✓ canlı; a11y `label` ve SEO description sonraki deploy'da kapanır. Performans (unused-JS ~238 KiB, server-response 780ms, text-compression) **bilinçli ertelendi** — ayrı optimizasyon turu (lazy-split + Vercel sıkıştırma); "yapıldı" denmedi.
- **P1–P9:** P5 ✓ (a11y tek-kaynak etiket) · P8 ✓ (25010 *Usability/Accessibility* + SEO keşfedilebilirlik) · P9 ✓ (web-only fix; native kaynağa sızmaz).
- **ISO:** 9241 (etkileşim: etiketli alan) · 25010 *Usability* (erişilebilirlik) · 25012 — yok · 42010 (web dağıtım görünümü: CI meta enjeksiyonu belgelendi).
- **Değerlendirilen alternatifler:** her `TextInput`'a tek tek `accessibilityLabel` (tekrar/kaçırma riski → reddedildi, `Field`'de merkezileştirildi) · `+html.tsx`'i bırakmak (bu pipeline'da etkisiz/ölü → CI enjeksiyonu tercih edildi) · perf'i şimdi düzeltmek (kapsam büyük → ayrı tura ertelendi).

## ADR-035 — Niyet asistanı: watcher kurulumunda AI sohbeti (Gemini tarzı)
- **Durum:** Kabul · TOGAF Phase B/C (Application — yeni etkileşim yüzeyi) — ürün sahibi: "AI sohbet olsun, Gemini gibi chat ekranı olsun; genel kalırsa bize spesifik detay sorsun".
- **Bağlam:** Yeni-watcher sihirbazının 1. adımı serbest metin kutusuydu; muğlak niyetler ("telefon fiyatları") aramada tespit edilemez konu üretiyordu. Backend'de zaten Groq (OpenAI-uyumlu, JSON modu) reasoner deseni vardı.
- **Karar:** Uçtan uca **niyet asistanı**: (1) sözleşme `assistChatInputSchema`/`assistReplySchema` (`ready`,`message`,`intent`,`frequencyMinutes`,`confidence`); (2) port `IntentAssistant.chat(history)`; (3) impl **GroqIntentAssistant** (sistem istemi: muğlaksa TEK soru sor; netleşince ready=true + tek cümle niyet + aciliyete göre sıklık öner) + **HeuristicIntentAssistant** (anahtarsız dev: bir kez netleştirme sorusu); (4) route `POST /v1/watchers/assist` (auth + **özel rate-limit** `ASSIST_PER_MINUTE`=10/dk — LLM maliyet/istismar koruması); (5) uygulama katmanı tutarsızlık normalizasyonu (ready ∧ boş intent → ready=false); (6) mobil 1. adım **sohbet UI**: balonlar (kullanıcı sağ/accent, asistan sol/panel), yazıyor göstergesi, "izlemeye hazır" onay kartı, alta sabit giriş+gönder (≥44pt, accessibilityLabel), otomatik kaydırma (reduce-motion'da animasyonsuz); hazır niyet `rawIntent`'e, önerilen sıklık plan sınırına oturtulup (`snapFreq`) `freq`'e yazılır; FSM korunur (`stepValid(0)=readyIntent≠null`).
- **Gizlilik (25012/27001):** Sohbet geçmişi **kalıcı saklanmaz** — yalnız LLM'e iletilir; kalıcı olan tek şey kullanıcının onayladığı `raw_intent` (zaten PII zonunda). Geçmiş 40 mesajla sınırlı (sözleşme + istemci `slice(-40)`).
- **Sonuçlar:** Muğlak niyetler kuruluma girmeden netleşir → tespit kalitesi artar. Ödün: 1. adım assist endpoint'ine bağımlı; hata halinde sohbete hata balonu düşer ve kullanıcı yeniden dener (Groq kesintisinde dev-fallback yalnız anahtarsız ortamda). Doğrulama: typecheck 3 paket + biome temiz + backend test 62 (assist muğlak/spesifik + selamlama-regresyonu dahil).
- **P1–P9:** P1 ✓ (sohbet ephemeral, PII saklanmaz) · P2 ✓ (port/impl hexagonal) · P5 ✓ (a11y: balon/giriş/gönder etiketli) · P6 ✓ (rate-limit) · P8 ✓ · P9 ✓.
- **ISO:** 29148 (gereksinim: "spesifik olana dek soru sor" sistem istemiyle kodlandı) · 25010 *Functional Suitability* + *Security* (özel hız sınırı) · 27002 (kaynak istismarı kontrolü) · 9241 (diyalog ilkeleri: tek soru/turn, ilerleme görünür) · 42010 (yeni etkileşim görünümü).
- **Değerlendirilen alternatifler:** istemciden doğrudan LLM çağrısı (anahtar sızıntısı → reddedildi) · sihirbazı tamamen kaldırıp salt sohbet (sıklık/filtre/alarm adımları yapılandırılmış kalmalı → hibrit seçildi) · sohbet geçmişini DB'ye yazmak (gereksiz PII → reddedildi).
- **Takip — sistem istemi v2 (canlı kullanıcı geri bildirimi):** İlk istem "hangi şehir/bölge?" gibi soru kategorileri saydığı için model ulusal/tekil olaylarda (YKS duyurusu) bile yer soruyor ve temperature 0.3'te **aynı soruyu aynen tekrarlıyordu** (papağan döngüsü). v2: "soru istisnadır" ilkesi + ulusal/tekil olayda yer sorma yasağı + aynı soruyu tekrar yasağı + kullanıcı 'genel' derse ısrarsız ready=true + sohbet başına en çok 2 soru + few-shot örnekler (YKS dahil). Doğrulama: kullanıcının birebir başarısız konuşması Groq'a karşı 3 senaryoda canlı test edildi. Hardcode yok — davranış tamamen istemden.
- **Takip — sistem istemi v3 (genellik; ürün sahibi: "sırf YKS değil, daha genel"):** v2'deki YKS/KPSS adları istemden **tamamen çıkarıldı** — konu/marka adı sıfır. Soru kararı evrensel teste bağlandı: *"eksik bilgi NEYİN aranacağını değiştiriyor mu?"* (tek-merci duyuru → sorma; yere/ürüne/eşiğe göre değişen → sor). Ara deneme (örneksiz salt-ilke) aşırı düzeltti — model hiç soru sormaz oldu; **çok-alanlı jenerik few-shot** geri eklendi. İstem tabanı **İngilizce'ye** çevrildi + "kullanıcının dilinde yanıtla" kuralı (Türkçe-tabanlı istem, İngilizce isteklerde intent'i Türkçeye çeviriyordu). Doğrulama: **7 senaryolu canlı Groq matrisi** — ulusal duyuru ×2 (soru yok) · 'genel' itirazı (ısrarsız kabul) · muğlak kategori (tek soru) · yere-bağlı olay (bölge sorar; bölge gelince ready) · İngilizce istek (İngilizce intent). 7/7 ✓.

## ADR-036 — Araştırma şeffaflığı: kontrol başına arama süreci kaydı + akordeon detay
- **Durum:** Kabul · TOGAF Phase B/C/D (Data + Application) — ürün sahibi: "watcher'a dokununca önceki aramalar görünsün (en yeni üstte); bir aramaya tıklayınca AI'nın düşünme ve arama sürecini görelim".
- **Bağlam:** `check_runs` yalnız özet+reasoning saklıyordu; AI'nın **neyi aradığı ve hangi sonuçları gördüğü** (arama süreci) kayboluyordu. Watcher detayındaki kontrol listesi de hep-açık ve süreçsizdi.
- **Karar:** (1) **Migration 0006**: `check_runs.search_query text` + `search_hits jsonb` (ikisi de nullable — eski satırlar bozulmaz; canlıya açık izinle uygulanır). (2) `CheckOutcome` + `RecordCheckRunInput` + `CheckRunView`'a `searchQuery`/`hits` eklendi; `LiveChecker` arama sonuçlarını geçirir, hata yolunda sorgu yine yazılır (`hits=null`). (3) Sözleşme `searchHitViewSchema` (title/snippet/url/date). (4) Mobil `RunCard` **akordeon** oldu: kapalı satır (durum+güven+tarih, ≥44pt, `accessibilityState.expanded`), dokununca **"arama süreci"** (🔍 sorgu + sonuç kartları: başlık/snippet/url/tarih) + **"yapay zekânın değerlendirmesi"** (🧠 reasoning). Sıralama zaten `ran_at desc` (en yeni üstte). Eski kayıtlarda dürüst boş-durum: "arama detayı kaydedilmedi (eski kayıt)".
- **Gizlilik (P1/25012):** Saklanan veri PII'siz — canonical sorgu + kamusal web sonuçları (paylaşılan zon); `raw_intent` dış hatta yine çıkmaz.
- **Sonuçlar:** Kullanıcı her kontrolün kanıt zincirini görür (ne arandı → ne bulundu → AI ne düşündü → karar). Ödün: jsonb satır boyutu büyür (~5-10 sonuç/koşu, kabul edilebilir). Doğrulama: typecheck 3 paket + biome + 64 test.
- **P1–P9:** P1 ✓ (PII'siz) · P5 ✓ (akordeon a11y) · P7 ✓ (nullable kolon, geri alınabilir) · P8 ✓ (25010 *Transparency/Trust*) · P9 ✓.
- **ISO:** 25010 *Functional Suitability* + güven/şeffaflık · 25012 (eski kayıtlar null-tolere) · 9241 (aşamalı ifşa — progressive disclosure) · 42010 (veri görünümü güncellendi).
- **Değerlendirilen alternatifler:** sonuçları ayrı tabloya normalize etmek (sorgu başına join maliyeti; jsonb yeterli → reddedildi) · yalnız reasoning göstermek (kullanıcı açıkça arama sürecini istedi → reddedildi).

## ADR-037 — Akış kalabalığı: tekrar-bildirim bastırma + watcher-bazlı gruplama
- **Durum:** Kabul · TOGAF Phase B/C (Application) — ürün sahibi: "akışta neden sürekli aynı watcher'lar ekranı kaplıyor, çok gereksiz kalabalık".
- **Bağlam:** İki kök neden: (1) **Motor**: süregelen bir olay (örn. bir kez yapılmış duyuru) her kontrolde yeniden detected=true sayılıyor → her koşuda yeni DetectionEvent + Delivery → akış aynı watcher'ın kopyalarıyla doluyordu. (2) **UI**: akış, teslimat başına tam boy kart basıyordu.
- **Karar:** (1) **Yenilik (novelty) bastırma**: `Checker.check(topic, ctx)` + `ReasonInput.lastEventDescription` — `runTopicCheck` son bildirilen olayı çekip checker'a verir; üç muhakeme istemine (Groq/DeepSeek/OpenAI) evrensel kural eklendi: "daha önce bildirilen olayın tekrarı/teyidi tespit DEĞİLDİR → detected=false". (2) **Akış gruplama**: watcher başına TEK kart — en yeni tespit gösterilir, "N yeni" + "toplam N tespit" rozetleri; karta dokununca grubun tüm okunmamışları okundu olur (optimistik patch) + watcher detayına gider (tam geçmiş zaten orada, ADR-036 akordeonuyla).
- **Sonuçlar:** Yeni kopya bildirimler kaynağında kesilir; birikmiş eskiler görsel olarak tek karta katlanır. Ödün: gerçek ardışık FARKLI gelişmelerde akışta yalnız en yenisi öne çıkar (detay ekranında hepsi var); LLM-bazlı yenilik kararı deterministik değil — regresyon testi bağlamın iletilmesini garanti eder (karar kalitesi istemle).
- **P1–P9:** P1 ✓ (son olay açıklaması PII'siz/paylaşılan zon) · P3 ✓ (gereksiz teslimat üretimi kesildi) · P5 ✓ (rozetler metinli) · P8 ✓ (25010 *Efficiency*: daha az event/delivery satırı) · P9 ✓.
- **ISO:** 25010 *Functional Suitability* (bildirim = yalnız YENİ gelişme) + *Performance Efficiency* · 9241 (bilgi yoğunluğu azaltma/gruplama) · 25012 (veri tekrarı kaynağında önlenir) · 42010 (akış görünümü güncellendi).
- **Değerlendirilen alternatifler:** yalnız UI gruplama (kök neden sürer, DB şişer → yetmez) · sabit cooldown (örn. 24 saat bildirme — gerçek YENİ gelişmeyi de susturur → reddedildi) · açıklama benzerliği eşiği/embedding (ek bağımlılık; LLM zaten karar veriyor → istem kuralı seçildi).

## ADR-038 — Araştırma görünümü: gerçek LLM konuşma dökümü + tespit tekilleştirme
- **Durum:** Kabul · TOGAF Phase C (Application/UI) — ürün sahibi: "tespit yukarıda iki kez; kontrole tıklayınca LLM araması/konuşması/düşünce süreci gözüksün — gerçek ve tam".
- **Bağlam:** (1) Bastırma (ADR-037) öncesi birikmiş kopya DetectionEvent'ler detayda alt alta basılıyordu. (2) Kontrol detayı kısa özet gösteriyordu; kullanıcı modelin tam alışverişini istiyor.
- **Karar:** (1) **Tespit tekilleştirme (görünüm)**: aynı açıklamalı olaylar tek karta katlanır — "⟳ N kez bildirildi · ilki <tarih>" notuyla; DB'ye dokunulmadı (kayıtlar kanıt olarak durur). (2) **Konuşma dökümü**: kontrol akordeonu sohbet-balonu dökümü oldu — "watcher → modele" balonu (izlenen konu + modele giden numaralı arama sonuçları, kayıttan birebir) + "model → karar" balonu (tespit/güven + TAM gerekçe metni). Döküm **uydurma değil**: kontrol anında saklanan gerçek girdi (search_query+hits) ve çıktı (decision/confidence/reasoning) render edilir. Eski kayıtlarda dürüst rozet: "arama dökümü kaydedilmeye başlanmadan önce çalıştı".
- **Sonuçlar:** Kullanıcı her kontrolde modelin tam kanıt zincirini sohbet formunda görür. Canlı doğrulama: son koşu 02:58Z (deploy öncesi) → hit_count=0 beklenen; ilk deploy-sonrası saatlik koşudan itibaren döküm dolu gelir. Ödün: sistem istemi metni UI'da gösterilmiyor (statik/teknik; istenirse eklenir).
- **P1–P9:** P1 ✓ (gösterilen veri PII'siz paylaşılan zon) · P5 ✓ (balonlar metin etiketli) · P7 ✓ (yalnız görünüm; veri silinmedi) · P8 ✓ (25010 *Transparency*).
- **ISO:** 25010 şeffaflık/güven · 25012 (kopyalar veri olarak korunur, görünümde katlanır) · 9241 (diyalog dökümü zihinsel modeli — sohbet metaforu).
- **Değerlendirilen alternatifler:** kopya event'leri DB'den silmek (geri alınamaz; deliveries/feedback FK'leri; görünüm katlaması yeterli → şimdilik reddedildi, istenirse ayrı izinli temizlik) · ham JSON göstermek (okunmaz → balon dökümü seçildi).

## ADR-039 — Güncellik: tarihe duyarlı arama + tarih-farkında muhakeme
- **Durum:** Kabul · TOGAF Phase C (Application) — ürün sahibi: "güncel tarihlere göre araması gerekiyor".
- **Bağlam:** Arama eski tarihli haberleri getiriyordu (canlı gerekçede görüldü: "geçmiş tarihli haberler yer alıyor"); ayrıca LLM **bugünün tarihini bilmediğinden** sonuç tarihlerini "şimdi" ile kıyaslayamıyordu — bayat habere yanlış tespit verme riski.
- **Karar:** (1) **Serper**: önce `tbs=qdr:w` (son 1 hafta) ile arama; 0 sonuçsa bağlam için filtresiz yedek arama. (2) **Tavily**: `days:7` + `topic:news`. (3) **Üç muhakeme istemine** (Groq/DeepSeek/OpenAI) `Bugünün tarihi: YYYY-MM-DD` satırı + kural: "bugüne yakın tarihli kanıt olmadan detected=true verme; eski tarihli haber kanıt DEĞİLDİR".
- **Sonuçlar:** Model artık taze sonuçlarla ve tarih bilinciyle karar verir → bayat-haber kaynaklı yanlış tespit riski düşer. Ödün: haftadan eski ama hâlâ geçerli tek-seferlik duyurular filtreli aramada görünmez — filtresiz yedek bu boşluğu kapatır (0-sonuç durumunda). Doğrulama: 3 yeni regresyon testi (qdr:w gönderimi · boşsa filtresiz yedek · isteme bugünün tarihi + önceki olay gider) — toplam 68 test.
- **P1–P9:** P1 ✓ (değişen yalnız sorgu parametreleri) · P8 ✓ (25010 *Functional Correctness* — tespit doğruluğu) · P9 ✓.
- **ISO:** 25010 *Functional Correctness/Suitability* · 25012 *Currentness* (veri güncelliği — tam isabet bu boyut) · 29148 (gereksinim: "güncel tarihe göre ara" ölçülebilir kurala çevrildi).
- **Değerlendirilen alternatifler:** `qdr:d` (24 saat — saatlik kontrolde çok dar, kaynak gecikmeleri kaçar → hafta seçildi) · yalnız istem kuralı (arama yine bayat getirirdi → iki katman birlikte) · sonuçları tarihe göre istemcide filtrelemek (Serper `date` alanı serbest metin "2 gün önce" — güvenilmez → sağlayıcı filtresi seçildi).

## ADR-040 — Kullanıcı-kapsamlı watcher duraklat/sürdür + sil
- **Durum:** Kabul · TOGAF Phase C (Application) — ürün sahibi: "alarm silme ve durdurma tuşu da ekle".
- **Bağlam:** Duraklat/sil yalnız admin konsolunda vardı; kullanıcı kendi watcher'ını listeden yönetemiyordu (backend'de kullanıcı-kapsamlı endpoint de yoktu).
- **Karar:** (1) `WatchRepository.delete` port'a eklendi (supabase + in-memory). (2) Route'lar: `POST /v1/watchers/{id}/status` + `DELETE /v1/watchers/{id}` — **sahiplik kontrolü** (başkasınınki → 404, varlık sızdırılmaz) + **sürdürürken plan limiti** (oluşturma ile aynı kural: free=3 aktif doluysa 403). (3) Mobil listede her kartta "❚❚ duraklat / ▶ sürdür" + "sil" (Alert onaylı, destructive); react-query mutation + watchers/subscription invalidation.
- **Sonuçlar:** Kullanıcı kendi alarmlarını yönetir; limit kuralı sürdürmede de delinemez. Ödün: silme kalıcı (DB cascade: deliveries watch'a bağlı) — Alert onayı zorunlu kılındı.
- **P1–P9:** P2 ✓ (port→impl→route) · P5 ✓ (≥44pt, etiketli butonlar, yıkıcı eylem onaylı) · P6 ✓ (sahiplik: yatay yetki kaçağı yok — 404) · P8 ✓ · P9 ✓.
- **ISO:** 27001/27002 (erişim kontrolü: nesne-düzeyi yetkilendirme, varlık gizleme 404) · 25010 *Functional Suitability* + *Security* · 9241 (yıkıcı eylemde onay diyaloğu; durum görünür).
- **Değerlendirilen alternatifler:** silme yerine arşivleme (şimdilik kapsam dışı; duraklatma zaten geri-dönüşlü yol → kalıcı silme + onay seçildi) · admin endpoint'lerini kullanıcıya açmak (yetki modeli karışır → ayrı kullanıcı-kapsamlı route).

## ADR-041 — Anında ilk kontrol: watcher kurulur kurulmaz arama başlar
- **Durum:** Kabul · TOGAF Phase C (Application) — ürün sahibi: "alarmı kurar kurmaz varsayılan olarak o saniye arama başlasın, ordan periyot başlasın".
- **Bağlam:** Yeni topic ilk kontrolünü zamanlayıcının bir sonraki turunda (≤60 sn, Render cron'da daha geç olabilir) alıyordu; kullanıcı kurulum anında sonuç görmüyordu.
- **Karar:** `createWatcher` YENİ oluşturulan topic'i anında `CHECK_QUEUE`'ya alır (`CreateWatcherDeps.queue`); kontrol hemen koşar, `markTopicChecked` ile bir sonraki kontrol "şimdi + frequency"den sayılır → **periyot kurulum anından başlar**. Mevcut (paylaşılan) topic yeniden kullanılıyorsa kuyruğa alınmaz — zaten rotasyonda, geçmişi timeline'da anında görünür; çift kontrol/maliyet üretilmez.
- **Sonuçlar:** Kullanıcı watcher'ı açar açmaz ilk araştırmayı (arama dökümü + model kararı, ADR-036/038) saniyeler içinde görür. Ödün: zamanlayıcı turu ile nadir yarış → en kötü bir erken çift kontrol; tekrar-bastırma (ADR-037) çift bildirimi zaten engeller. Doğrulama: uçtan uca test (worker kayıtlı konteyner: POST /watchers → timeline'da ≥1 kontrol) + 4 test dosyasının deps'ine queue eklendi — toplam 70 test.
- **P1–P9:** P2 ✓ (application katmanında, route'a sızmadı) · P3 ✓ (paylaşılan topic'te çift iş yok) · P8 ✓ (25010 *Time Behaviour* — ilk değer süresi dakikalardan saniyelere) · P9 ✓.
- **ISO:** 25010 *Performance Efficiency / Time Behaviour* + *Functional Suitability* (anında geri bildirim) · 9241 (sistem durumu görünürlüğü: kurulumdan hemen sonra kanıt) · 29148 (istek ölçülebilir davranışa çevrildi: enqueue-on-create).
- **Değerlendirilen alternatifler:** route'ta senkron kontrol bekletmek (oluşturma isteği LLM+arama süresince bloklanır, timeout riski → reddedildi; kuyruk asenkron) · zamanlayıcı aralığını kısaltmak (tüm sisteme maliyet; hedefe özgü değil → reddedildi).

## ADR-042 — Konu paylaşımı: birebir-metin garantisi + yıl-farkında PII kuralı
- **Durum:** Kabul · TOGAF Phase B (Data) — ürün sahibi: "birebir gerçekten aynı konu olduğundan emin olsun; başkasının izlediği alakasız konuyu izletmesin".
- **Bağlam:** `canonicalize` 4+ haneli TÜM sayıları sıyırıyordu → "50000 altına" ile "30000 altına" AYNI konuya yapışıyordu (kayıplı dönüşüm = yanlış paylaşım). Ayrıca yıllar (2026) PII sanılıp konu yanlışlıkla "kişisel"e düşüyordu.
- **Karar:** (1) **Paylaşılan arketipte kanonikleştirme KAYIPSIZ**: yalnız harf/boşluk normalizasyonu — paylaşım ancak birebir aynı metinde olur. (2) **PII-sayı kuralı inceltildi**: kimlik = ≥5 hane VEYA yıl-olmayan 4 hane; yıllar (1900–2099) kamusaldır, korunur ve arketipi kişiselleştirmez. (3) Kişisel arketipte kimlik sayıları yine sıyrılır (P1: sorgu dış aramaya gider).
- **Sonuçlar:** Yanlış konu paylaşımı yapısal olarak imkânsızlaştı (metin eşitliği); yıl içeren ulusal konular paylaşılan kalır. Ödün: küçük yazım farkları artık ayrı topic üretir (arama maliyeti ↑) — doğruluk > maliyet (ürün sahibi talebi). Doğrulama: 2 yeni canonicalize regresyon testi — toplam 71.
- **P1–P9:** P1 ✓ (kişiselde PII sıyırma sürer) · P2 ✓ (saf domain fonksiyonu) · P8 ✓ (25012 doğruluk).
- **ISO:** 25012 *Accuracy/Consistency* (yanlış birleşme giderildi) · 27001 (PII kuralı korunarak inceltildi) · 29148.
- **Değerlendirilen alternatifler:** LLM-bazlı semantik eşleme (maliyet+belirsizlik; ileride asistan intent'i zaten standartlaştırıyor → şimdilik metin eşitliği yeter) · embedding benzerlik eşiği (yanlış-pozitif riski tam da şikâyet edilen şey → reddedildi).

## ADR-043 — Tasarım sistemi v2: vektör ikonografi + motion katmanı + 3 yeni skill
- **Durum:** Kabul · TOGAF Phase C (Application/UI) — ürün sahibi: "arayüz çirkin ve AI-ürünü gibi, butonlarda kötü emoji; gerçek tasarım yap; gelişmiş web dizayn + UI/UX + animasyon skill'lerini internetten indir; animasyon yok".
- **Bağlam:** Butonlar/rozetler/sekmeler unicode-emoji ikon kullanıyordu (👍 ❚❚ ▶ 🔍 ✦ ⚙ …) — platformlar arası tutarsız ve "hazır iş" görünümlü; liste/akordeon/balon girişlerinde animasyon yoktu (reanimated kurulu ama babel plugin'i bile eksikti).
- **Karar:** (1) **3 yeni skill** (web araştırmasıyla — IxDF/UXPin/Reanimated docs/Clay 2026 kaynakları): `web-design-advanced` (görsel hiyerarşi, tip ölçeği 1.25, **emoji-ikon yasağı**), `ui-ux-advanced` (progressive disclosure, mikro-etkileşim, 4-durum kuralı), `motion-design` (reanimated kalıpları, süre token'ları, stagger, reduce-motion zorunlu, "animasyon yok = iş bitmemiş"); CLAUDE.md'de dördü birlikte zorunlu kılındı. (2) **lucide-react-native + react-native-svg** eklendi; TÜM emoji ikonlar vektöre çevrildi (sekmeler: Sparkles/Bell/Star/Settings/Shield · eylemler: Play/Pause/Trash2/ThumbsUp/ThumbsDown/Send/Plus/Search/MapPin/Eye/Chevron'lar/RotateCw); buton metinleri uppercase→normal case. (3) **Motion katmanı** `src/components/motion.tsx`: `EnterItem` (FadeInUp stagger, springify d18/s180, ≤12 öğe), `ExpandIn` (akordeon 200ms), `PressScale` (0.97 spring) — hepsi reduce-motion kapılı; babel'e `react-native-reanimated/plugin` eklendi (eksikti — animasyonların çalışmamasının kök nedeni). Liste/akış/tespit/kontrol kartları + sohbet balonları girişle geliyor.
- **Sonuçlar:** Tutarlı vektör ikonografi + gerçek hareket dili. Ödün: bundle +svg/lucide (~ikon başına tree-shake'li); web'de reanimated entering desteği Expo 53 + worklets ile sağlanır — CI build'inde doğrulanacak, sorun çıkarsa graceful (animasyonsuz render).
- **P1–P9:** P5 ✓ (ikonlar etiketli; renk-bağımsız durum) · P8 ✓ (25010 *Appropriateness/UX*) · P9 ✓.
- **ISO:** 9241 (mikro-etkileşim geri bildirimi, tutarlılık) · 25010 *Usability/Attractiveness* · 42010 (UI bileşen envanteri: motion katmanı eklendi).
- **Değerlendirilen alternatifler:** @expo/vector-icons (daha ağır, çok set karması → lucide tek-dil) · Lottie (varlık üretimi gerek; mikro-etkileşim için aşırı → reanimated yeter) · emoji'leri tutmak (ürün sahibi açıkça reddetti).

## ADR-044 — Destek katmanı: sorun bildir + canlı destek + admin bildirimi + iletişim
- **Durum:** Kabul · TOGAF Phase B/C (Data + Application) — ürün sahibi: "sorun bildir katmanı; admin paneline gelsin; iletişim sayfasına e-postamı ekle; canlı talepte admine bildirim gitsin".
- **Bağlam:** Kullanıcının sorun iletme / canlı yardım alma kanalı yoktu; admin tarafında da görünür değildi.
- **Karar:** (1) **Migration 0007**: `support_tickets` (kind: problem|live, status: open|closed) + `support_messages` (sender: user|admin, FK cascade); RLS açık-policy'siz (yalnız service-role; PII zonu). (2) Port `SupportRepository` + supabase/in-memory impl; sözleşmeler (`supportTicketSchema` vd.). (3) Kullanıcı uçları `/v1/support` (aç/listele/mesajlaş — **sahiplik 404**) + admin uçları `/v1/admin/support` (listele e-postayla, yanıtla, kapat). (4) **Canlı talepte adminlere push**: `createSupportTicket` application servisi `admin.listAdminIds()` (port'a eklendi) → cihaz token'larına FCM fan-out; bildirim hatası talebi düşürmez (best-effort + log). (5) Talep açma spam koruması: assist kovasıyla ayrı bucket rate-limit. (6) Mobil: Ayarlar → **"Destek & İletişim"** sayfası (e-posta: mehmetdem782100@gmail.com mailto kartı · sorun bildir formu · canlı destek başlat + taleplerim) + sohbet ekranı (5 sn yoklama, balonlar, EnterItem animasyonu); admin paneline **"Destek" sekmesi** (10 sn yoklamalı liste, açıklar önce; sohbet + yanıtla + kapat).
- **Sonuçlar:** Uçtan uca destek döngüsü: kullanıcı yazar → admin push alır → panelden yanıtlar → kullanıcı 5 sn içinde görür. Ödün: gerçek-zamanlılık yoklamayla (websocket altyapısı yok; ölçek küçükken yeterli, ileride Supabase Realtime'a geçilebilir). Doğrulama: uçtan uca http testi (aç→admin liste→yanıt→sahip görür→yabancı 404→kapat) — toplam 72 test.
- **P1–P9:** P1 ✓ (destek mesajları PII zonu; RLS deny + service-role) · P2 ✓ (port→impl→application→route) · P5 ✓ (form/sohbet/butonlar etiketli, ≥44pt) · P6 ✓ (sahiplik 404 + rate-limit) · P9 ✓.
- **ISO:** 25010 *Functional Suitability* + *Security* · 27001/27002 (nesne-düzeyi yetki, PII erişim kısıtı, spam sınırı) · 9241 (4-durum: gönderildi onayı, boş durum, hata+kurtarma) · 25012 (mesaj bütünlüğü FK cascade) · 42010 (yeni destek görünümü envanterde).
- **Değerlendirilen alternatifler:** yalnız mailto (takipsiz, admin panelsiz → yetmez) · websocket canlı sohbet (altyapı maliyeti; yoklama yeterli → ertelendi) · üçüncü parti destek aracı (Intercom vb. — maliyet+veri paylaşımı → reddedildi).

## ADR-045 — Whenly rebrand + 6 ekran maket uyarlaması (gerçek-veri ilkesiyle)
- **Durum:** Kabul · TOGAF Phase C (Application/UI) + marka kararı — ürün sahibi 6 maket paylaştı ("şunları da ayarla") ve marka sorusuna "Whenly olsun" dedi.
- **Bağlam:** Maketler (Whenly markalı): abonelik hero kartı + kullanım barı + faturalama; profil kartlı ayarlar; numaralı adım göstergeli sihirbaz + örnek çipleri + sıklık kartları; ikon-avatarlı watcher listesi + filtre çipleri; admin donut + sistem sağlığı; akış özet kartları + filtreler.
- **Karar — gerçek-veri ilkesi:** maketteki her öğe YALNIZ gerçek veri/işlevle uygulandı; karşılığı olmayanlar bilinçle atlandı: sahte fatura geçmişi YOK (abonelik yokken "yakında" rozetli gerçek fiyatlar), sihirbazda "Kaynak tipi" ve WhatsApp/Telegram bildirim seçenekleri YOK (backend'de yok — ölü toggle basılmaz), MRR alan grafiği YOK (gelir geçmişi tutulmuyor), akışta "tarama 24s" kartı YOK (kullanıcı-kapsamlı uç yok; eklenirse gelir). Uygulananlar: (1) **Whenly rebrand**: app.json adı, login, sekme başlığında W logosu, SEO meta/OG. (2) **Akış**: 3 gerçek özet kartı (watcher/bugünkü tespit/okunmamış) + Tümü-Okunmamış filtresi. (3) **Watcher listesi**: niyetten türetilen deterministik kategori ikon-avatarı (afet/fiyat/sınav/bilet/varsayılan), durum filtre çipleri, "N watcher aktif" dipnotu. (4) **Sihirbaz**: numaralı 5-adım göstergesi, selamlama altında dokun-gönder örnek çipleri, sıklık kart ızgarası (15 dk PRO-kilitli — plan sınırı gerçek 403 kuralıyla uyumlu). (5) **Abonelik**: Crown hero kartı + gerçek haklar (entitlements) çipleri + kullanım progress barı + gerçek faturalama satırları. (6) **Ayarlar**: avatar-baş harfli profil kartı + sürüm dipnotu. (7) **Admin**: plan dağılımı donut'u (svg, gerçek free/pro) + **sistem sağlığı** (env'den türetilen GERÇEK yapılandırma bayrakları: Supabase/Arama/AI/FCM/Stripe — Container.serviceHealth, sözleşmeye `services` eklendi).
- **Sonuçlar:** Maket dili canlıya gerçek veriyle taşındı. Ödün: atlanan sahte öğeler maket-birebir görünümü kırar — dürüstlük > kozmetik (ürün ilkesi). Doğrulama: typecheck 3 + biome + 72 test.
- **P1–P9:** P5 ✓ (tüm yeni etkileşimler rol+etiketli; progressbar/tablist/tab) · P8 ✓ (25010 *Attractiveness/Usability*) · P9 ✓ (yalnız mevcut yetenekler yüzeye çıktı).
- **ISO:** 9241 (tanınabilirlik: kategori ikonları; durum görünürlüğü: kullanım barı/sağlık) · 25010 · 25012 (sahte veri basılmadı) · 42010 (marka+görünüm envanteri güncellendi).
- **Değerlendirilen alternatifler:** maketi birebir kopyalamak (sahte fatura/ölü toggle — reddedildi) · markayı Watcher tutmak (ürün sahibi Whenly seçti).

## ADR-046 — Resmî-kaynak-önce arama + son-24-saat haber güncelliği
- **Durum:** Kabul · TOGAF Phase B/C (Data + Application) — ürün sahibi: "9 saat önceki habere bakmış, son haberlere bakmalı; ne sorarsak soralım önce resmî kurumu arasın, orijinal sitelerden araştırsın".
- **Bağlam:** Arama genel web'de qdr:w (hafta) ile kalıyordu; resmî kurum sitesi (duyurunun ASIL kaynağı) önceliklenmiyordu, tazelik gün değil hafta çözünürlüğündeydi.
- **Karar (jenerik — kurum adı hardcode YOK):** (1) **AuthorityResolver portu** + GroqAuthorityResolver: konunun resmî kurumunu/alan adını LLM çözer ("haber sitesi resmî kaynak DEĞİLDİR; emin değilsen null — uydurma"); **konu başına BİR KEZ** çağrılır, `canonical_topics.authority_domain/authority_resolved`'a cache'lenir (migration 0008; çözüm hatasında resolved bırakılmaz → sonraki koşuda yeniden denenir). (2) **Serper /news ucu** (`searchNews`, tbs=qdr:d — SON 24 SAAT) SearchProvider'a opsiyonel yetenek olarak eklendi; FallbackSearchProvider delege eder. (3) **LiveChecker orkestrasyonu**: paralel `site:{authority} q` (ilk 4, başlıklara `[RESMÎ]` etiketi) + 24-saat haberleri; URL dedupe; ikisi de boşsa mevcut genel arama (qdr:w→filtresiz) yedeği. (4) **Muhakeme kuralı** (Groq/DeepSeek): "[RESMÎ] etiketli sonuç kurumun kendi sitesindendir — EN GÜÇLÜ kanıt; haberle çelişirse resmî esas; resmî yoksa en YENİ habere ağırlık ver."
- **Sonuçlar:** Her konuda önce resmî kaynak + günlük tazelikte haber; çözüm maliyeti konu başına tek LLM çağrısı (cache). Canlı doğrulama (4 alan): sınav→osym.gov.tr · deprem→afad.gov.tr · asgari ücret→bakanlık · telefon→apple.com — hiçbiri kodda yazılı değil. Ödün: yanlış kurum çözümü riski (istem "emin değilsen null" der; genel arama yedeği her durumda var).
- **P1–P9:** P1 ✓ (yalnız PII'siz kanonik sorgu LLM'e/aramaya gider) · P2 ✓ (port→impl; cache topic'te) · P3 ✓ (konu başına tek çözüm — fan-out maliyeti yok) · P8 ✓ · P9 ✓.
- **ISO:** 25012 ***Credibility* + *Currentness*** (kaynak güvenilirliği + tazelik — bu işin tam karşılığı) · 25010 *Functional Correctness* · 29148 (istek ölçülebilir davranışa: resmî-önce + qdr:d).
- **Değerlendirilen alternatifler:** kurum→domain statik tablosu (konuya-özel hardcode; ADR-042/043 genellik ilkesine aykırı → reddedildi) · her kontrolde çözüm (gereksiz LLM maliyeti → cache seçildi) · yalnız haber araması (resmî duyurular habere geç düşer → site: birincil).
