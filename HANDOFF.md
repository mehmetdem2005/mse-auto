# HANDOFF — Claude Code için dağıtım runbook'u

Bu repo bir **iskelet + spesifikasyon**. Aşağıdaki adımları sırayla uygula. Kod çalışır mantıkla
yazıldı ama derleme/dağıtım/anahtarlar burada bağlanacak. Eksikler `// TODO` ile işaretli.

Hedef: tek kullanıcılık (private) bir uygulama; web Vercel'de, worker Render'da, veri Supabase'de,
YouTube hesabına resmî API ile bağlı. **Mehmet telefondan çalışıyor**, PC yok — adımları telefondan
yapılabilecek şekilde (Codespaces/bulut VM gerekiyorsa belirt) düşün.

## 0) Önce oku
- `PLAN.md` §0'daki YouTube hayatta-kalma stratejisini koru: `requireHumanApproval` AÇIK kalsın,
  günlük tavan düşük, AI ifşası açık. Bunları kapatma.
- Tüm model id'leri ve sırlar env'den gelir. `.env.example`'ı kopyala.

## 1) Bağımlılıklar + derleme
```bash
npm install                 # workspaces (core, worker, web)
npm run build -w @studio/core
npm run build -w @studio/worker
```
- `// TODO`: `@google/genai` SDK'sının çağrı imzalarını kurulu sürümle doğrula (generateContent /
  embedContent / image). TTS REST çağrısı `gemini.ts`'te; SDK TTS'i sarmalıyorsa ona geçir.

## 2) Supabase
1. Proje oluştur. SQL editöründe `supabase/schema.sql`'i çalıştır (pgvector + tablolar + RPC'ler).
2. `EMBED_DIM` (env) ile `vector(N)` (şema) **eşit** olmalı (varsayılan 768).
3. Storage bucket aç: `media` (render edilen mp4/wav için, opsiyonel önizleme). `// TODO`: worker'da
   `video_path`'i Storage'a da yüklemek istersen `video.ts`/worker'a ekle (şu an /tmp'ten YouTube'a).
4. Anahtarlar: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server/worker), `SUPABASE_ANON_KEY` (web).

## 3) Tohumla (knowledge tabanı)
```bash
npm run seed -w @studio/core      # data/knowledge.seed.json → pgvector
```
Doğrulanmış hikâyeler yüklenir; Knowledge sayfasından daha fazla ekleyebilirsin.

## 4) Web → Vercel
- `apps/web`'i Vercel'e bağla (monorepo root, build komutu Next).
- Env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server-only route'lar için), `SUPABASE_ANON_KEY`,
  `GEMINI_API_KEY` (knowledge ingest route'u embedding için kullanır).
- `// TODO`: `next-env.d.ts` ve gerekiyorsa `app/api/.../route.ts` için Node runtime (`export const
  runtime = "nodejs"`) ekle (googleapis/genai edge'de çalışmaz).

## 5) Worker → Render (ffmpeg ister)
- `apps/worker/Dockerfile` ffmpeg kurar. `apps/worker/render.yaml` blueprint'i kullan (Docker worker).
- Env (Render): GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, YOUTUBE_* , EMBED_DIM,
  TICK_MS, WORK_DIR=/tmp/shorts, ORIGINALITY_THRESHOLD.
- Çalışma modu: `loop` (sürekli) ya da Render **Cron** ile `node apps/worker/dist/index.js tick`
  her ~10 dk.

### 5a) YouTube OAuth refresh token (bir kez)
1. Google Cloud'da OAuth client (Desktop/Web) oluştur, YouTube Data API v3'ü etkinleştir.
2. Consent ekranı; kapsamlar `youtube.upload` + `youtube.readonly`.
3. Refresh token üret: `youtube.ts`'teki `consentUrl()`'ı yerelde çalıştır → URL'i aç → onay → dönen
   `code`'u token'a çevir (`oauth.getToken(code)`), `refresh_token`'ı `YOUTUBE_REFRESH_TOKEN`'a koy.
   `// TODO`: küçük bir `scripts/youtube-auth.ts` yardımcı (consentUrl yazdır + code→token) ekle.
4. **Önemli (kapsam):** OAuth consent ekranı "Testing" modunda refresh token ~7 günde dolabilir;
   tek kullanıcı için test kullanıcısı eklemek yeterli olabilir, yoksa "Production"a geçirip Google
   doğrulamasını değerlendir. Kanalın bağlı olduğu Google hesabıyla yetkilendir.

### 5b) AI ifşası
- `youtube.ts` açıklamaya ifşa satırı koyar ve API'de varsa `containsSyntheticMedia` dener. API alanı
  sürümünde yoksa: ilk birkaç yüklemede YouTube Studio'da "Altered/Synthetic content" toggle'ını teyit
  et. İfşa dağıtımı düşürmez (PLAN §0).

## 6) Uygulamayı KİLİTLE (private)
Birini seç:
- **Vercel Authentication / Password Protection** (en hızlı; tüm route'lar parola arkasında).
- **Supabase Auth + allowlist**: `apps/web/middleware.ts` ekle, oturum yoksa /login'e yönlendir; tek
  email allowlist. (`// TODO`: middleware + minimal login.)
- Service-role anahtarı yalnız server route/worker'da; client component'lere koyma.

## 7) APK (telefon)
Uygulama bir Next.js PWA. APK için iki yol:
- **TWA (Bubblewrap)**: PWA'yı (manifest + service worker ekle) Trusted Web Activity APK'ya sar.
  `// TODO`: `apps/web/public/manifest.json` + `next-pwa` veya manuel SW.
- **Capacitor**: `npx cap init`, `webDir` = Next export/host URL, `npx cap add android`, Android
  Studio/Gradle ile APK. Telefonda PC yoksa: Codespaces veya bulut Android-build (ör. EAS/GitHub
  Actions ile Gradle) kullan.
- En basiti: web'i Vercel'de host et, telefonda "ana ekrana ekle" (PWA) → APK gerekmeyebilir. APK
  şartsa TWA en az sürtünmeli.

## 8) İlk uçtan uca test
1. Worker `tick` çalıştır → bir taslak `needs_review`'a düşmeli.
2. Web → Queue → taslağı incele, açını düzelt, **Approve**.
3. `tick` tekrar → narration + görseller + ffmpeg render → `scheduled` (tohumlu gündüz slotu).
4. Slot gelince `tick` → YouTube'a yükleme → `published`. Analytics birkaç saatte dolar.

## Bilinen TODO listesi (özet)
- [ ] SDK imzalarını kurulu sürümle doğrula; TTS'i SDK destekliyorsa REST'ten SDK'ya taşı.
- [ ] `scripts/youtube-auth.ts` (refresh token üretici).
- [ ] Web API route'larına `runtime="nodejs"`.
- [ ] Private kilit (Vercel password ya da Supabase Auth middleware).
- [ ] PWA manifest + (opsiyonel) Capacitor/TWA APK.
- [ ] (Opsiyonel) Render edilen mp4'ü Supabase Storage'a yükle + panelde önizleme.
- [ ] (Opsiyonel kalite) ffmpeg yerine Remotion render yolu.
- [ ] ffprobe ile tam ses süresine göre beat zamanlaması (video.ts şu an eşit böler).

---

# v0.2 — AAA katmanları (ek adımlar)

Bunlar v0.1 adımlarına eklenir. Tümü additive.

## A) Migration'ları sırayla çalıştır
`supabase/migrations/0001_init.sql` sonra `0002_aaa_layers.sql` (lease/retry kolonları, `job_events`,
`usage_ledger`, `system_state`, `claim_next_job`/`reclaim_stale_locks` RPC'leri, RLS, trigger).
Bundan sonra şema değişiklikleri **numaralı migration** olarak eklensin.

## B) Yeni env değişkenleri
`APP_PASSWORD` (zorunlu — web private kilidi; uzun rastgele string), `LOG_LEVEL`, `DAILY_USD_CAP`,
`DAILY_YOUTUBE_UNITS_CAP`, `LEASE_SECONDS`. Worker ve web'e ekle.

## C) RLS / güvenlik
0002 tüm tablolarda RLS'i açar; anon reddedilir. Web sunucu route'ları **service-role** ile okur (zaten
öyle). Tarayıcıya service-role anahtarı koyma. Daha sonra Supabase Auth'a geçersen anon policy'leri ekle.

## D) Gözlemlenebilirlik / monitör
- Uptime monitörünü `/api/health` (liveness) ve `/api/status` (sağlıksızsa 503 + metrikler) uçlarına bağla.
- `// TODO (P0)`: `dead_letter>0` / `budget_pause` / status 503 → Slack/Telegram/e-posta webhook alert.

## E) Kontrol düzlemi
- Observability sayfasındaki **Pause/Resume** kill switch'i ve **mod** (run/draft_only/dry_run) çalışır.
- Dead-letter işleri **Requeue** ile yeniden kuyruğa girer. Kanal politika taraması olursa: **Pause**'a bas.

## F) Düzeltilen build hatası
`workspace:*` → `*` yapıldı (npm workspaces protokolü). `npm install` artık kök dizinde sorunsuz.

## G) Test / CI
`npm run test -w @studio/core` (vitest, 8 test). `.github/workflows/ci.yml` install→typecheck→test→build.

## v0.2 TODO (ARCHITECTURE.md §6 ile aynı, P0 özet)
- [ ] Alert webhook'ları (status/dead-letter/budget).
- [ ] Idempotent upload (çift yayın engeli) + gerçek token metering.
- [ ] Supabase Auth + allowlist (parola cookie yerine).
- [ ] OpenTelemetry + Sentry; ffprobe zamanlama + Storage; replay aracı.

---

# v0.3 — internetten araştırılan eksikler kapatıldı (bkz. RESEARCH.md)

**Yeni env:** `YOUTUBE_DEFAULT_PRIVACY` (varsayılan private), `SESSION_SECRET` (imzalı login çerezi —
uzun rastgele string), `ALERT_WEBHOOK_URL` (dead-letter/bütçe uyarıları), `WORKER_TOKEN` (serve /tick
auth), `PORT`.

**Kritik — YouTube denetimi:** Doğrulanmamış API projeleri videoları **private** yükler; herkese açık
yapmak için Google **audit** gerekir. Audit'ten önce `unlisted/private` kullan, sonra `public`.

**Çalıştırma seçenekleri:** Worker artık 3 mod: `tick` (tek tur), `loop` (her zaman açık), `serve`
(HTTP `POST /tick` + `/health`). Önerilen: Render **Web Service** `serve` modu + Supabase **pg_cron**
ile tetikleme (migration `0003_scheduling.sql`, Vault'a `worker_tick_url` + `worker_token` koy).

**Güvenlik:** Login çerezi artık HMAC imzalı (parola çerezde değil). `SESSION_SECRET` ata.

**Migration sırası:** 0001 → 0002 → (opsiyonel) 0003.

**Doğrulama:** `npm run test -w @studio/core` → 10/10. Kalan öneriler RESEARCH.md sonunda.

---

# v0.4 — çok-ajanlı denetim kurulu + hassas rate limit + profesyonel kuyruk

**Migration:** 0001 → 0002 → 0003(ops) → **0004** (review kolonları, `cleanup_old_jobs`, `queue_depth`).

**Yeni env:** `REVIEWER_QUORUM` (5), `MAX_REVISE_ROUNDS` (2), `REVIEW_MODEL`, `REVISE_MODEL`,
`RATE_LIMITS_JSON` (tier'ına göre gerçek limitleri gir; varsayılan ücretsiz-katman güvenli).

**Davranış:** Taslak aşaması artık `agents.runEditorialPipeline` — her senaryo ≥5 denetçiden geçer,
baş editör konsolide eder (Doğruluk/Politika/Telif veto'lu), gerekirse düzeltir; geçemezse/blok varsa
**insana** gider. Onay kartında kurul raporu görünür. Deterministik compliance (cosine/cap/ifşa) de ek
kapı olarak çalışır. **İnsan son onay** açık kalsın (YouTube hayatta kalma + kalite).

**Rate limit:** `ratelimit.ts` istekleri `floor(60000/RPM)+1 ms`'e paceler; Tier 1'de hızlanmak için
`RATE_LIMITS_JSON` ayarla. Çok worker'a geçersen sayaçları Redis/Postgres'e taşı (RESEARCH §12).

**Kuyruk retention:** pg_cron ile günlük `select cleanup_old_jobs(30);` planla (0003 örneğindeki gibi).

**Doğrulama:** `npm run test -w @studio/core` → 15/15 (zamanlayıcı, dayanıklılık, rate-limit, kurul).

---

# v0.5 — ajan swarm (dinamik plan + araç kullanan alt-ajanlar)

**Yeni env:** `AGENT_MODE` (swarm|board; vars. swarm), `SWARM_MAX_PARALLEL` (3), `SWARM_STEP_BUDGET`
(40), `SWARM_RETRIES` (1). Maliyet/hız hassasiyeti için `AGENT_MODE=board` daha ucuz/hızlıdır.

**Davranış:** Taslak aşaması `orchestrator.produceShort` — planner görevi DAG'a böler, alt-ajanlar
araçlarla (RAG/web araştırma/pano) paralel çalışır, sentezleyici nihai senaryoyu üretir, sonra ≥5
denetçili kurul + insan kapısı. Swarm hata verirse otomatik kurul hattına düşer.

**Dürüstlük:** Bu, Kimi'nin model-native swarm'ına eşit değildir (AGENTS.md "Dürüst karşılaştırma").
Avantaj: öngörülebilir, test edilebilir, denetlenebilir; her ajan turu + araç çağrısı bütçeye yazılır.

**Doğrulama:** `npm run test -w @studio/core` → **21/21** (zamanlayıcı, dayanıklılık, rate-limit,
kurul konsolidasyonu, ReAct runtime, swarm bağımlılık/retry).

**İlk değer:** Free-tier'da swarm çok Gemini çağrısı yapar (rate limiter ~6 sn aralıkla sıraya koyar,
yavaş ama güvenli). Hız için Tier 1 + `RATE_LIMITS_JSON`. Bütçe cap'i aşılırsa otomatik durur.

---

# v0.6 — replan + durable checkpoint + OTel-GenAI trace + guardrail (araştırma odaklı)

**Migration:** … → **0005** (agent_runs checkpoint tablosu + span index'leri).
**Yeni env:** `SWARM_REPLAN_ROUNDS` (1), `AGENT_GUARDRAILS` (on).
**Davranış:** `produceShort` artık: giriş guardrail → (varsa checkpoint'ten **resume**) → plan → swarm →
**replan** (başarısızlıkta) → sentez → ≥5 kurul. Her wave sonrası checkpoint kaydedilir; başarıda silinir.
OTel-GenAI span'leri job_events'e yazılır (jobId varken). Worker `SupabaseCheckpointer` geçirir.
**Gözlemlenebilirlik:** span'leri dışa aktarmak için ince bir OTel exporter ekle (job_events type='span',
`data` içinde `gen_ai.*`). Backend: Langfuse/Jaeger/Grafana Tempo/Datadog.
**Geniş araştırma:** AGENT-RESEARCH.md (framework karşılaştırması + ne aldık/almadık).
**Doğrulama:** `npm run test -w @studio/core` → **25/25**.

---

# v0.7 — autonomy: GitHub PR self-improvement + broad monitor + self-heal + rate-limit resume

**Migration:** … → **0006** (improvements, opportunities, panels).
**Yeni env:** `GITHUB_TOKEN/OWNER/REPO/BASE_BRANCH`, `SELF_IMPROVE_ENABLED` (off), `SELF_IMPROVE_AUTOMERGE`
(off), `MONITOR_ENABLED` (on), `AUTONOMY_EVERY_TICKS` (20), `RATELIMIT_RESUME_DELAY_MS` (120000).
**Davranış:** Worker her `AUTONOMY_EVERY_TICKS` tick'te `supervisor.superviseOnce()` çağırır (sinyaller +
bellek onarımı + dinamik paneller). `SELF_IMPROVE_ENABLED=on` + GitHub kimlikleri varsa top fırsattan bir
**PR** açar (CI zorunlu kapı; düşük-risk+yeşil+opt-in ise otomatik-merge). Rate-limit'te iş **dead-letter'a
düşmez**, `next_run_at` ileri alınıp **aynı istekten** devam eder.
**UI:** yeni **/lab** (Autonomy Lab) — iyileştirme PR'ları + fırsatlar + ajanın yazdığı dinamik tablolar.
**Güvenlik & dürüstlük:** **SELF-IMPROVEMENT.md** (PR/CI/canary/rollback/Rulesets modeli + sınırlar).
**Önce yap:** GitHub token oluştur (`repo`), main'e **branch protection/Rulesets + required check = CI**,
sonra `SELF_IMPROVE_ENABLED=on`. Auto-merge'i bir süre **off** tut, PR'ları elle gözden geçir.
**Doğrulama:** `npm run test -w @studio/core` → **30/30**.

---

# v0.8 — crew hiyerarşisi + dinamik tool + sandbox/politika + competitor + full-auto

**Migration:** … → **0007** (tools_registry, announcements).
**Yeni env:** `AUTONOMY_FULL` (off — full-auto + insansız yayın, YouTube kapatma riski!), `COMPETITOR_VIDEO_IDS`,
`CORE_SRC_DIR`.
**Yeni modüller:** `crew` (manager→uzman roller + `managerPlan`), `toolregistry` (dinamik + `synthesizeToolSpec`),
`sandbox` (Shared/Agent/Cache), `policy` (evaluate), `audit` (auditModules), `ratelimitprofile` (governor),
`competitor` (fetchTranscript + analyzeCompetitor), `announce`.
**Davranış:** Özerklik turu artık AAA modül denetimi + rakip analizi (COMPETITOR_VIDEO_IDS) + (full-auto'da)
Türkçe gerekçe duyurusu yapar. `AUTONOMY_FULL=on` insan onayını atlar; **YouTube riski** nedeniyle varsayılan kapalı.
**Doğrulama:** `npm run test -w @studio/core` → **37/37**.

---

# v0.9 — surgical self-edit + GEPA prompt-lab + anomaly autonomy + OTel/merge-queue/A2A

**Migration:** … → **0008** (prompts, incidents).
**Yeni env:** `SELF_IMPROVE_CODE` (off), `PROMPTLAB_ENABLED` (off), `ANOMALY_AUTONOMY` (on), `OTEL_EXPORTER_OTLP_ENDPOINT`.
**Yeni modüller:** `patch` (cerrahi edit), `promptlab` (GEPA), `otel` (OTLP exporter), `a2a`, `anomaly`
(bounded action commander), `mergequeue` (queue+canary+revert) + `youtube.setVideoPrivacy` + `selfimprove.proposeEdits/submitEditPR`.
**Davranış:** Özerklik turu artık anomali→karar→aksiyon (güvenli uzay), OTel export, prompt-audit yapar;
`SELF_IMPROVE_CODE=on` iken modül fırsatlarını **cerrahi find/replace PR'ı** ile düzeltir.
**Güvenlik:** yüksek-risk aksiyonlar otomatik değil; cerrahi edit belirsizse reddeder; kill switch + PR/CI kapısı.
**Doğrulama:** `npm run test -w @studio/core` → **44/44**.

---

# v1.0 — crew = canlı üretim hattı + prompt auto-swap + canary auto-revert

**Migration:** … → **0009** (canaries).
**Yeni env:** `AGENT_MODE=crew` (varsayılan), `CANARY_WINDOW_MIN` (30), `CANARY_ERROR_DELTA` (0.15).
**Davranış:** `produceShort` artık varsayılan olarak **crew** hattını kullanır (manager→uzman roller, rol-scope
araçlar, otomatik prompt'lar); hata → board. Ajan prompt'ları `getActivePrompt` ile saklı en iyi sürümü
kullanır. Otonom merge sonrası canary açılır; regresyonda otomatik **revert PR**.
**Sağlamlık:** `recordUsage` ve `getActivePrompt` fail-fast (telemetri/prompt-arama pipeline'ı bloklamaz).
**Doğrulama:** `npm run test -w @studio/core` → **47/47**.

---

# v1.1 — standartlar uygunluğu (STANDARDS.md)
Yeni modüller: `acl` (FIPA ACL), `actors` (Actor/mailbox), `contractnet` (CNP bidding), `bdi`, `authz`
(Zero-Trust), `standards` (uygunluk matrisi). Anomali aksiyonları artık `authz.can(...)` kapısından geçer.
Özerklik turu `standards.complianceReport()` loglar. Sözleşme: **STANDARDS.md** (her turda okunur).
Oyun-AI desenleri (GOAP/BT/Spatial) bu pipeline'da `na` — Godot projesine aittir. Test: **53/53**.

---
# v1.2 — eski na'lar gerçekten kuruldu (GOAP/BT/Spatial/Leader/Ontology/Contract)
Migration → **0010** (leader_lease, triples). Yeni modüller: `goap`, `behaviortree`, `spatial` (kd-tree),
`leader` (lease seçimi), `ontology` (KG), `contract` (+`proto/agent.proto`). `AGENT_MODE=goap` planlayıcıyı
devreye alır; özerklik artık **lider-kapılı** (`WORKER_ID`). STANDARDS.md §8 yeniden sınıflandırmayı içerir. Test **59/59**.

---
# v1.3 — hata avı + sağlamlaştırma (strict typecheck temiz)
Tüm çekirdek pakette katı `tsc --noEmit` çalıştırıldı; bulunan **5 gerçek tip hatası düzeltildi → 0 hata**:
1. `anomaly.ts` — `remember("strategy_note")` geçersiz kind → `MemoryEntry.kind` union'ına `strategy_note` eklendi.
2. `tools.ts` — ajan-girdili serbest `kind` union'a uymuyordu → izinli değilse `"fact"`e indirgenir (asla geçersiz kind yazılmaz).
3. `orchestrator.ts` (goap dalı) — `plan` alanı `Task[]` tipliyken string[] atanıyordu → düzeltildi.
4-5. `gemini.ts` ×2 — `thinkingConfig.thinkingLevel` SDK'nın `ThinkingLevel` tipini bekliyordu → çalışma-zamanı değeri uygun şekilde verildi.
Testler **59/59**. NOT (dürüst): yalnızca `@studio/core` katı tiplendi; `apps/worker` ve `apps/web` ayrıca tam tiplenebilir;
ve `thinkingLevel` alanının canlı API'da kabulü henüz doğrulanmadı (canlı-test maddesi).

---
# v1.4 — Arayüzden YouTube bağlama (tek-tıkla OAuth)
Migration → **0011** (oauth_tokens). Akış: /settings → "Connect YouTube" → `/api/youtube/auth` (Google consent)
→ `/api/youtube/callback` (`youtube.exchangeCodeAndStore` → oauth_tokens) → worker `youtube` refresh token'ı
oauth_tokens'tan okur (env fallback). Google Cloud OAuth client'ta redirect URI = `<web>/api/youtube/callback`.
Gerekli env: `YOUTUBE_CLIENT_ID/SECRET/REDIRECT_URI` (REFRESH_TOKEN artık opsiyonel). Scopes: youtube.upload + readonly.
