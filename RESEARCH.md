# RESEARCH — internetten doğrulanan eksikler ve v0.3 düzeltmeleri

Bu tur **internetten araştırıp** projenin gerçek eksiklerini çıkardım (resmî Google/YouTube/Supabase
dokümanları + güncel 2026 kaynakları). Her bulgu: ne doğruladım → projede hangi açığı gösterdi → ne
yaptım. Sonunda kalan öneriler.

---

## 1) YouTube: doğrulanmamış projeler videoyu PRIVATE yükler (denetim şart)  ⚠️ kritik
**Bulgu (resmî YouTube Data API dokümanı):** "API projects created post-July 28, 2020 upload videos
privately by default; audit compliance is required to lift this restriction." Yani yeni bir OAuth
projesi, Google **denetiminden geçene kadar** videoları herkese açık yayınlayamaz.
**Açık:** v0.2 yükleyici "public" varsayıyordu → yeni projede videolar sessizce gizli kalırdı.
**Yapılan:** `YOUTUBE_DEFAULT_PRIVACY` env (varsayılan `private`); HANDOFF'a denetim uyarısı; gerçek
kullanıma kadar `unlisted/private` öner.

## 2) YouTube: AI ifşa alanı API'de gerçekten var
**Bulgu:** `status.containsSyntheticMedia` (30 Ekim 2024'ten beri) `videos.insert/update` ile set
edilebilir — uydurma değilmiş, v0.2'deki alan **doğruymuş**.
**Yapılan:** Doğrulandı, korundu. (Açıklamaya ifşa satırı + #Shorts da ekleniyor.)

## 3) YouTube: `selfDeclaredMadeForKids` gönderilmezse video görüntülenmeye kapanır
**Bulgu:** Alan absent olursa video sessizce "izlenemez" durumda kalır (omitempty tuzağı).
**Yapılan:** Açıkça `false` set ediliyor (zaten öyleydi, doğrulandı ve not düşüldü).

## 4) Gemini: garantili JSON için `responseSchema` var (regex kurtarmaya gerek yok)
**Bulgu (ai.google.dev/structured-output):** `responseMimeType:"application/json"` + `responseSchema`
(JSON Schema) ya da Zod ile **şema garantili** çıktı. JS SDK destekliyor.
**Açık:** v0.2 scriptwriter sadece `responseMimeType` kullanıp JSON'ı regex'le kurtarıyordu (kırılgan).
**Yapılan:** `SHORT_SCRIPT_SCHEMA` eklendi; scriptwriter artık şema ile üretiyor (regex sadece fallback).
Not: şema + tool (search) kombinasyonu nadiren çakışabildiği için function-calling kaldırıldı, konu
kaydı kod tarafında yapılıyor.

## 5) Gemini: gerçek token sayımı `usageMetadata` ile
**Bulgu:** Yanıt `usageMetadata` (promptTokenCount/candidatesTokenCount/totalTokenCount) döndürür.
**Açık:** v0.2 bütçe **tahmini** token kullanıyordu (yanlış maliyet).
**Yapılan:** `generate()` artık gerçek `usage` döndürüyor; scriptwriter onu iletiyor; runner bütçeye
**gerçek** token yazıyor (tahmin sadece fallback).

## 6) Gemini: rate limit çok boyutlu (RPM/TPM/RPD/IPM), 429 + Retry-After
**Bulgu (2026 kaynakları + resmî):** Aralık 2025 kesintisinden sonra ücretsiz katman düşük (5–15 RPM,
250k TPM, 100–1000 RPD). Aşımda **429 RESOURCE_EXHAUSTED** + çoğu zaman `Retry-After`. Doğru çözüm:
jitter'lı üssel backoff; RPM dakikada toparlar, RPD gün sonuna kadar sürer. "Ghost 429" hataları da var.
**Açık:** v0.2 `withRetry` rate-limit'i normal hata gibi görüyordu (çok kısa backoff).
**Yapılan:** `isRateLimit()` + `withRetry` rate-limit farkında (çok daha uzun backoff, `Retry-After`'a
saygı). Gemini/YouTube çağrıları artık `breaker.run(withRetry(...))` ile sarılı. Test eklendi (geçiyor).

## 7) Gemini: güvenlik blokları yanıtı çökertmemeli
**Bulgu:** `promptFeedback.blockReason` / `finishReason: SAFETY|PROHIBITED_CONTENT` olabilir.
**Açık:** v0.2 bloklu yanıtta JSON parse hatasıyla retry'a girip dead-letter'a kadar boşa denerdi.
**Yapılan:** `SafetyBlockedError` eklendi; runner bunu **retry etmez**, `needs_review`'a (insan karar)
yönlendirir ve konuyu "kullanıldı" işaretler.

## 8) Idempotency: retry'da çift yükleme riski
**Bulgu/akıl:** Yükleme başarılı olup DB yazımından önce worker çökerse, retry **ikinci kez** yükleyebilir.
**Yapılan:** Açıklamaya gizli `[asid:<key>]` marker'ı gömülüyor; retry'da `findUploadedByKey()` kanalı
arar, varsa yeniden yüklemeden o id'yi döndürür. (`idempotency_key` zaten 0002'de.)

## 9) Alerting yoktu (v0.2 P0)
**Yapılan:** `alerts.ts` — dead-letter / bütçe-pause / kritik durumlarda Slack/Discord/Telegram-uyumlu
webhook'a bildirim (`ALERT_WEBHOOK_URL`). Runner bağlandı.

## 10) Güvenlik: parola çerezde düz metindi
**Açık:** v0.2 `as_auth` çerezi APP_PASSWORD'u **düz** tutuyordu (forge edilebilir/sızabilir).
**Yapılan:** Çerez artık **HMAC ile imzalı token** (`SESSION_SECRET`); edge'de Web Crypto, login'de
node crypto ile doğrulanıyor; sabit-zaman karşılaştırma. Parola asla çerezde değil.

## 11) Mimari: Supabase yerleşik zamanlayıcı/kuyruk var (pg_cron + pgmq + pg_net + Vault)
**Bulgu (Supabase dokümanı):** pg_cron (cron), pgmq (kuyruk, visibility timeout = lease), pg_net (SQL'den
HTTP), Vault (sır) yerleşik.
**Yapılan:** Worker'a HTTP `serve` modu (`POST /tick` + `/health`, `WORKER_TOKEN` korumalı) eklendi;
`0003_scheduling.sql` pg_cron + pg_net ile worker'ı zamanlı tetikler (her zaman açık loop gerekmez).
pgmq, ileri ölçek için kuyruk yükseltmesi olarak belgelendi (sistem-kaydı yine `video_jobs`).

---

## Kalan öneriler (bir sonraki tur)
- **OAuth doğrulama akışı:** YouTube API audit başvurusu + consent ekranı "Production" (test modunda
  refresh token ~7 günde dolabilir). Bunu üretimde hallet.
- **Gerçek OpenTelemetry trace** export (traceId zaten taşınıyor) + **Sentry** hata izleme.
- **pgmq'ya geçiş** (yüksek hacim) — visibility timeout'lu native kuyruk.
- **ffprobe** ile tam ses süresine göre altyazı zamanlaması; render artefaktlarını Supabase Storage'a.
- **Per-dependency token-bucket** rate limit (circuit breaker'a ek proaktif throttle).
- **E2E test** (Gemini/YouTube mock) + sözleşme testleri; **load** testi.
- **Context caching** (Gemini) ile sistem-prompt maliyetini düşür.
- **Music bed:** YouTube Audio Library / lisanslı kaynak entegrasyonu (şu an görsel+seslendirme).

> Net: v0.3 ile bu tur araştırılan **somut, doğrulanmış** eksiklerin hepsi kapatıldı veya temeli atıldı.
> Doğrulama testleri yeşil (10/10).

---

# v0.4 — gerçek rate limitleri, profesyonel kuyruk, çok-ajanlı denetim (internetten)

## 12) Gerçek Gemini rate limitleri + "+1 ms" pacer
**Bulgu (2026, Aralık 2025 kesintisi sonrası):** çok boyutlu (RPM/TPM/RPD/IPM), proje başına token
bucket. Ücretsiz: Flash ≈ **10 RPM / 250k TPM / 250–1500 RPD**, Pro ≈ **5 RPM / 100 RPD**; Tier 1
(faturalama açık) ≈ **150–300 RPM**. Aşımda 429 RESOURCE_EXHAUSTED.
**Yapılan:** `ratelimit.ts` — istek aralığını **floor(60000/RPM)+1 ms**'e sabitleyen pacer (ör. 10 RPM →
6001 ms) + 60s kayan istek penceresi + TPM penceresi + günlük RPD cap'i. Gemini (text/reasoning/image/
embed/tts) ve YouTube çağrıları sarıldı. Sayılar `RATE_LIMITS_JSON` ile tier'ına göre ayarlanır. Test
+1 ms pacing ve RPD cap'ini doğruluyor.

## 13) Profesyonel kuyruk
**Bulgu:** at-least-once teslim kuralı → **idempotency şart** (key + dedup); jitter'lı backoff;
**izlenen DLQ** + alert; görünürlük zaman aşımı (= lease); öncelik; **ayrı worker süreci**;
removeOnComplete/retention ile sınırsız büyümeyi önle. Node+Postgres için profesyonel kütüphaneler:
**pg-boss** (SKIP LOCKED, ACID, Redis yok) veya **pgmq** (Supabase Queues, native visibility timeout);
Redis varsa **BullMQ** (öncelik, rate limit, flow/DAG, DLQ, OpenTelemetry).
**Yapılan:** Mevcut SKIP LOCKED kuyruğu zaten bu desenleri taşıyor (lease, retry/backoff, DLQ+alert,
öncelik, idempotency, ayrı worker). v0.4'te **retention/temizlik** (`cleanup_old_jobs`) + hızlı
`queue_depth()` RPC (migration 0004) eklendi. Yüksek hacim için pg-boss/pgmq'ya geçiş yolu belgelendi
(sistem-kaydı yine `video_jobs`).

## 14) Kimi'nin ajan sistemi (Agent Swarm, K2.6)
**Bulgu (Nis 2026):** Kimi K2.6 (1T MoE, 32B aktif) **Agent Swarm** ile 300 alt-ajan / 4000 adıma ölçekler;
lider orkestratör görevi **alan-uzmanı paralel alt-ajanlara böler** ve sonuçları **birleştirir**.
"Interleaved thinking + multi-step tool call"; **tool'u uygulama yürütür ve doğrular**. Bilinen zayıflık:
~%12 tool-call hatası ve orkestratörün bazen tek-ajana çökmesi → açıkça çok-ajan zorunlu kılınmalı +
retry/doğrulama.
**Yapılan:** Bu deseni **uygulama-orkestrasyonlu** bir editöryel kurula uyarladık (`agents.ts`,
bkz. AGENTS.md): orkestratör → prodüktör → **≥5 paralel denetçi** → baş editör (veto'lu, deterministik
konsolidasyon) → düzeltici döngüsü → insan eskalasyonu. Kararı kod verir (öngörülebilir, test edilebilir);
denetçi hatası kurulu çökertmez (Kimi'nin %12 sorununa karşı dayanıklılık).

---

# v0.5 — gerçek ajan framework'ü (dürüst Kimi karşılaştırması)

**Soru:** "Kimi kadar kaliteli ajan sistemi kur." **Dürüst cevap:** Kimi K2.6'nın Agent Swarm'ı
model-native + RL-eğitimli (300 alt-ajan / 4000 adım / uzun-ufuk araç kullanımı). Gemini API üstünde
buna **eşit** bir şey kurulamaz; model kendi tavanıdır. Yapılan: Kimi'nin mimari özelliklerini
uygulama-orkestrasyonuyla kurmak (bkz. AGENTS.md "Dürüst karşılaştırma" tablosu).

**Eklenenler (v0.5):**
- `runtime.ts` — araç kullanan **ReAct döngüsü** (think→act→observe), paylaşılan **blackboard**,
  global **adım bütçesi**, enjekte edilebilir LLM (test edilebilir). Kimi deseni: model aracı önerir,
  **uygulama yürütür/doğrular**, gözlem geri beslenir.
- `tools.ts` — **güvenli** araç seti (rag_search, kaynaklı web_research, recall/remember, blackboard).
  Bilinçli olarak dar: kod çalıştırma / dosya / serbest ağ yok.
- `orchestrator.ts` — **dinamik planlayıcı** (görev DAG'ı üretir; hata → DEFAULT_PLAN), **paralel**
  yürütücü (≤SWARM_MAX_PARALLEL, adım bütçeli), **süpervizör** (başarısız görevi yeniden dener),
  **sentezleyici**. `produceShort()` tek giriş: plan→swarm→sentez→kurul; swarm hata verirse kurul
  hattına **otomatik düşer**.
- Worker taslak aşaması artık `orchestrator.produceShort`'u çağırır; rapor planı + swarm izini de taşır
  (panelde görünür).

**Dürüstlük sınırları:** paralel/ufuk Kimi'ye göre sınırlı (varsayılan 3 paralel / 40 adım);
otomatik replan yok (süpervizör retry + revize döngüsü var); canlı Gemini araç-döngüsü bu repoda
çalıştırılmadı (mantık sahte modelle test edildi: 21/21). Avantajımız öngörülebilirlik + test
edilebilirlik + denetlenebilirlik; Kimi'nin avantajı ham ajan zekâsı + ufuk.

---

# v0.6 — geniş ajan araştırması + framework özelliklerini uyarlama

Geniş tarama **AGENT-RESEARCH.md**'de (LangGraph/Claude SDK/OpenAI SDK/Google ADK/CrewAI/MS Agent
Framework/… + Anthropic desenleri + MCP/A2A + OTel GenAI). Bu turda kapatılan eksikler:
- **Replan** (`orchestrator.replan`) — alt-görevler başarısızsa planlayıcı alternatif görevler üretir
  (LangGraph esnekliği; eski "otomatik replan yok" boşluğu kapandı).
- **Durable checkpoint/resume** (`checkpoint.ts` + `agent_runs` migration 0005) — çöken swarm baştan
  başlamaz, **devam eder** (LangGraph imzası).
- **OTel-GenAI span izleme** (`tracing.ts`) — `gen_ai.*` şekilli span'ler job_events'e (invoke_agent
  kökü + alt-ajan + generate_content). "Eksik gözlemlenebilirlik" antidesenine çare.
- **Giriş guardrail'i** (`orchestrator.guardrailCheck`) — üretimden önce konu güvenlik/değer ön-kontrolü
  (OpenAI SDK guardrails); fail-open, kurul yine kapı.
- **MCP-uyumlu araçlar** (`tools.toMcpToolDefs`) — araçlar MCP tanımına eşlenir (Linux Foundation standardı).

Dürüstlük: ağır framework'e geçilmedi (Anthropic'in birleştirilebilir-desen tavsiyesi); model-native/
uzun-ufuk swarm değil (model tavandır); A2A çoklu-ajan ağı + gerçek OTel SDK gelecektir. Test: 25/25.

---

# v0.7 — kendi-kodunu-değiştirme (güvenli) + geniş izleme + rate-limit resume
Detay: **AGENT-RESEARCH.md §8** + **SELF-IMPROVEMENT.md**. DGM/SICA (kendini değiştir + ampirik doğrula),
2026 güvenli-PR pratiği (çift kapı, branch protection/Rulesets, hard-fail CI, revert). Eklenenler:
`github.ts`, `selfimprove.ts` (risk-gated PR), `monitor.ts` (sinyal+yorum→fırsat), `supervisor.ts`
(self-heal+bellek onarımı), rate-limit "bekle ve aynı istekten devam", /lab dinamik tablolar. Test 30/30.

---

# v0.8 — ajan hiyerarşisi + dinamik tool + sandbox + YouTube uzmanı
Detay: **AGENT-RESEARCH.md §9**. manager→worker (orchestrator-worker ~%70), OpenSage/Yunjue dinamik tool
sentezi, AgentSys bellek izolasyonu, YouTube hook/satisfaction/outlier. Eklenenler: crew, toolregistry,
sandbox, policy, audit, ratelimitprofile, competitor, announce + full-auto toggle. Test 37/37.

---

# v0.9 — cerrahi edit + GEPA prompt + anomali otonomisi + OTel/merge-queue/A2A
Detay: **AGENT-RESEARCH.md §10**. GEPA (reflektif prompt), OpenAI/Aider cerrahi edit, Replit-dersli bounded
action autonomy, OTLP exporter, merge-queue/canary, A2A. Eklenenler: patch, promptlab, otel, a2a, anomaly,
mergequeue + surgical self-edit + setVideoPrivacy. Test 44/44.

---

# v1.0 — crew üretim hattı + prompt-swap + canary auto-revert
Detay: **AGENT-RESEARCH.md §11**. produceViaCrew (crew default), getActivePrompt swap (scriptwriter/synthesize/
roller), canary.checkCanaries/openCanary (auto-revert). Sağlamlık: recordUsage/getActivePrompt fail-fast. 47/47.
