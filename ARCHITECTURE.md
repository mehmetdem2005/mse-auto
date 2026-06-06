# ARCHITECTURE — AAA yükseltme (v0.1 iskelet → v0.2)

Bu doküman üç şey yapar: (1) v0.1 iskeletindeki **gerçek eksikleri** tespit eder (kategorize +
öncelik puanı), (2) eklenen **AAA katmanlarını** anlatır, (3) tam AAA için **kalan yol haritasını**
verir. İstediğin gibi yama değil; yönetilebilir, izlenebilir, dayanıklı **katmanlar**.

> Öncelik puanı = (Etki + Risk) × (6 − Efor), her biri 1–5. Yüksek puan = önce yap.

---

## 1) Eksik tespiti (tech-debt denetimi)

| # | Kategori | Eksik (v0.1) | Etki | Risk | Efor | Puan | Durum (v0.2) |
|---|----------|--------------|:----:|:----:|:----:|:----:|--------------|
| 1 | Architecture | İş kuyruğunda kilitleme yok → iki worker aynı işi kapabilir (race) | 5 | 5 | 3 | 30 | ✅ Atomik lease (`claim_next_job`, FOR UPDATE SKIP LOCKED) |
| 2 | Architecture | Yeniden deneme/backoff/dead-letter yok; hata = kalıcı `failed` | 5 | 5 | 3 | 30 | ✅ attempts+backoff+dead_letter (runner) |
| 3 | Infra | Gözlemlenebilirlik yok (sadece console.log) | 5 | 4 | 4 | 18 | ✅ Yapılandırılmış log + `job_events` izi + metrics + /status |
| 4 | Architecture | Aşama zaman aşımı yok; takılan çağrı döngüyü dondurur | 4 | 5 | 4 | 18 | ✅ `withTimeout` her aşamada |
| 5 | Infra | Maliyet/kota koruması yok (AI + YouTube kotası patlayabilir) | 5 | 5 | 3 | 30 | ✅ `usage_ledger` + günlük cap + otomatik pause |
| 6 | Security | RLS yok; web'de auth yok (URL'i bilen yükler) | 5 | 5 | 3 | 30 | ✅ RLS açık + tek-kullanıcı parola middleware + zod |
| 7 | Architecture | Kill switch / pause-resume / manuel retry yok | 4 | 4 | 2 | 32 | ✅ Kontrol düzlemi + Observability sayfası |
| 8 | Test | Test yok (zamanlayıcı/backoff saf ve test edilebilir) | 4 | 4 | 2 | 32 | ✅ vitest (8 test geçiyor) + CI |
| 9 | Code | Tipli env doğrulaması yok; kriptik runtime hataları | 3 | 4 | 2 | 28 | ✅ `env.ts` (zod, fail-fast) |
| 10 | Infra | Migration versiyonlama yok (tek schema.sql) | 3 | 3 | 2 | 24 | ✅ `supabase/migrations/0001,0002` |
| 11 | Dependency | `workspace:*` protokolü npm'de geçersiz (build kırılır) | 4 | 4 | 1 | 40 | ✅ `*`'a düzeltildi |
| 12 | Architecture | Idempotency yok; retry'da çift yükleme riski | 4 | 4 | 3 | 24 | ◐ `idempotency_key` + furthest-point requeue; tam dedupe roadmap |
| 13 | Code | Video zamanlaması kaba (ffprobe yok), artefakt temizliği yok | 3 | 3 | 3 | 18 | ◐ event'li render; ffprobe + Storage roadmap |
| 14 | Infra | Alerting/on-call yok | 4 | 4 | 3 | 24 | ◐ /status 503 verir (monitör bağlanabilir); webhook alert roadmap |
| 15 | Infra | Dağıtık trace (OpenTelemetry) yok | 3 | 3 | 4 | 12 | ◯ Roadmap (traceId altyapısı hazır) |

✅ tamam · ◐ kısmen (temel atıldı) · ◯ yol haritası

---

## 2) AAA katman mimarisi (eklenenler)

### a) Reliability (`reliability.ts` + runner + 0002 SQL)
- **Atomik lease:** `claim_next_job(worker, lease)` — `FOR UPDATE SKIP LOCKED` ile bir işi kilitler;
  iki worker asla aynı işi almaz. `reclaim_stale_locks()` çöken worker'ın işini geri alır.
- **Retry + backoff + dead-letter:** her aşama hata verirse `attempts++`, üssel backoff (`next_run_at`),
  `max_attempts`e ulaşınca `dead_letter`. `RetryableError` vs `FatalError` taksonomisi (kötü girdi
  sonsuz denenmez).
- **Timeout:** her aşamada `withTimeout` — takılan Gemini/ffmpeg/YouTube döngüyü dondurmaz.
- **Circuit breaker:** Gemini/YouTube için, art arda hatada bir süre devre açılır (bağımlılığı dövmeyi
  bırakır).

### b) Observability (`logger.ts`, `events.ts`, `metrics.ts`, /status, Observability sayfası)
- **Yapılandırılmış log:** her satır JSON (traceId/jobId/stage), sır redaksiyonlu → herhangi bir log
  toplayıcıya akar.
- **Olay/denetim izi:** `job_events` — her geçiş, retry, hata, süre, onay kaydedilir. "X işine ne oldu
  ve neden" sorusu tahminsiz cevaplanır. Panelde zaman çizelgesi.
- **Metrics + /status:** hata oranı (24s), aşama süreleri, günlük harcama/kota, dead-letter sayısı.
  `/api/status` sağlıksızsa 503 döner (uptime monitörü bağlanır). `/api/health` ucuz liveness.

### c) Control plane (`control.ts`, /api/control, ControlPanel)
- **Kill switch:** tek tıkla pause — tüm üretim/yükleme anında durur, **hiçbir şey kaybolmaz**.
- **Modlar:** `run` / `draft_only` (araştır+yaz ama yayınlama) / `dry_run` (yeni iş yok).
- **Manuel retry/requeue:** dead-letter işleri en ileri tamamlanan noktadan yeniden kuyruğa.

### d) Cost/Quota governance (`budget.ts`, `usage_ledger`)
- Her faturalanabilir birim (Gemini token/çağrı, görsel, TTS karakter, YouTube unit) kaydedilir.
- Günlük **USD cap** ve **YouTube kota cap**'i aşılırsa pipeline **otomatik pause** olur → sürpriz fatura
  yok. (Token sayımı şimdilik tahmini; tam metering için `usageMetadata` roadmap.)

### e) Security
- **RLS** tüm tablolarda açık; anon erişimi reddedilir (web sunucu route'ları service-role ile okur).
- **Tek-kullanıcı kilidi:** parola cookie middleware (`APP_PASSWORD`). Yükseltme: Supabase Auth + allowlist.
- **Girdi doğrulama:** API route'larında `zod`. **Sır redaksiyonu** loglarda.

### f) Quality / DX
- **Testler** (vitest): zamanlayıcı determinizmi/pencere/aralık, retry/fatal/timeout/circuit. 8/8 geçer.
- **CI** (GitHub Actions): install → typecheck → test → build.
- **Tipli env** (fail-fast). **Migration** versiyonlama.

---

## 3) Veri modeli v2 (0002 migration)

- `video_jobs` + `attempts, max_attempts, priority, locked_by, locked_until, next_run_at, last_error,
  trace_id, idempotency_key` ve `dead_letter` aşaması; `updated_at` trigger'ı.
- Yeni tablolar: `job_events` (denetim izi), `usage_ledger` (maliyet/kota), `system_state` (pause/mode).
- Yeni RPC: `claim_next_job`, `reclaim_stale_locks` (+ mevcut match/pick fonksiyonları).
- RLS tüm tablolarda.

---

## 4) Güncel akış

```
                ┌──────────── her tick ────────────┐
                │ assertRunning() (kill switch)     │
                │ assertWithinBudget() (yoksa pause)│
                │ reclaimStaleLocks()               │
                │ topUp() (cap'e kadar 'queued')    │
                └───────────────┬───────────────────┘
                                ▼
        claim_next_job()  ── atomik lease (SKIP LOCKED)
                                │
              ┌── queued ──▶ draft  (Gemini reasoning+RAG+search) ─┐
              │                                                     ▼
              │                              compliance gate → needs_review
              │                                                     │  [SEN: onay]
              │                                                     ▼
              ├── approved ─▶ render (TTS+görsel+ffmpeg) ─▶ scheduled (tohumlu slot)
              │                                                     │
              └── scheduled (slot geldi) ─▶ upload (YouTube API) ─▶ published
                                │                       │
            hata → retry(backoff) / max → dead_letter   ▼
                                              usage_ledger + job_events + analytics
```
Her ok bir `job_events` kaydı + yapılandırılmış log üretir; her dış çağrı circuit breaker + timeout
+ usage kaydı içinde.

---

## 5) Trade-off'lar ve büyüdükçe gözden geçirilecekler

- **Kuyruk = Postgres satır kilidi** (pgmq/Redis/Cloud Tasks değil). Tek kullanıcı/düşük hacim için
  doğru karar (ekstra altyapı yok, atomiklik var). Hacim artarsa: `pgmq` veya Cloud Tasks'a geç.
- **Tek worker, tick başına ≤3 iş.** Basit ve ucuz. Ölçek için: birden çok worker (lease zaten güvenli)
  + aşamaları ayrı kuyruklara böl.
- **Maliyet metering tahmini.** Doğru karar: hızlı MVP guard. Yükselt: `usageMetadata`'dan gerçek token.
- **Auth = parola cookie.** En az sürtünme. Yükselt: Supabase Auth (gerçek oturum, allowlist, rotation).
- **Log = stdout JSON.** Toplayıcıya akar. Yükselt: OpenTelemetry trace (traceId altyapısı hazır) +
  Sentry hata izleme + alert webhook'ları.

---

## 6) Kalan yol haritası (tam AAA)

**P0 (önce):**
- [ ] Alerting: `/status` 503 veya `dead_letter > 0` veya `budget_pause` → Slack/Telegram/e-posta webhook.
- [ ] Idempotent upload: yükleme öncesi `idempotency_key` ile YouTube'da var-mı kontrolü (çift yayın engeli).
- [ ] Gerçek token metering (`usageMetadata`) → bütçe doğruluğu.
- [ ] Supabase Auth + allowlist (parola cookie'nin yerine).

**P1:**
- [ ] OpenTelemetry trace export (traceId zaten taşınıyor) + Sentry.
- [ ] Per-dependency token-bucket rate limit (circuit breaker'a ek).
- [ ] ffprobe ile tam ses-süresine göre beat zamanlaması; render artefaktlarını Supabase Storage'a; temizlik.
- [ ] Replay/backfill aracı (bir trace'i baştan oynat), admin "force stage" kontrolü.
- [ ] E2E test (mock Gemini/YouTube) + sözleşme testleri.

**P2:**
- [ ] Infra-as-Code (Terraform/Render blueprint genişletme), blue/green deploy, otomatik migration gate.
- [ ] Çok kanal/çok worker yatay ölçek; aşama bazlı ayrı kuyruklar (pgmq/Cloud Tasks).
- [ ] Veri saklama/PII politikası, log retention, audit export.
- [ ] A/B: stil/hook varyantlarını analytics ile kapalı döngü optimize et (memory'ye performans içgörüsü).

---

## Özet
v0.2 ile sistem artık **kendi kendine toparlanan** (retry/lease/dead-letter), **izlenebilir** (olay izi +
metrics + /status), **yönetilebilir** (kill switch + modlar + manuel retry), **harcaması kontrollü**
(bütçe guard + otomatik pause) ve **güvenli** (RLS + auth + doğrulama) bir iskele. Geri kalanı §6'daki
yol haritası — ama omurga AAA.
