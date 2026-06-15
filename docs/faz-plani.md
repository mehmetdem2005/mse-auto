# Whenly — Profesyonel Modüler Yol Haritası (faz planı)

> **Amaç:** Whenly'yi MVP'den **olgun, ölçeklenebilir, profesyonel** bir ürüne taşıyan, **modüler**
> (her modül bağımsız ilerleyebilir) ve **fazlı** (her faz tek başına sevk edilebilir) bir plan.
> Bu belge canlı "ikinci beyin"in parçası — ADR (`mimari-karar-gunlugu.md`) ve EA (`EA-TOGAF-mimari.md`) ile birlikte okunur.

## Çalışma ilkeleri (her fazda geçerli)
- **Mimari:** Hexagonal (domain port → application → infra adapter → interfaces/http) · zod contracts (`@watcher/contracts`) · mobilde react-query + FSM · i18n ×11 typed-catalog.
- **Kapı (gate):** `pnpm biome check` + `pnpm turbo run typecheck` + `pnpm turbo run test` YEŞİL olmadan faz "bitti" sayılmaz.
- **İz:** Her anlamlı faz → **ADR** (sınıf: Artımlı/Düzeltici/Yeniden-mimari) + **EA C-0xx** satırı + "Standartlar" dipnotu.
- **Deploy:** `claude/great-mendel-de7vke` → main merge → Render (backend) + Vercel (mobil-web).
- **Sınır:** DB migration **yalnız açık izinle**; gizli değer repoya/çıktıya yazılmaz; **ABARTMA YOK** (yapılmayan "yapıldı" denmez).
- **Sıralama kuralı:** `[B]` engelleyici bağımlılık; `[M]` migration ister (izinli); `[G]` harici anahtar/karar ister.

---

## M1 — Backend Modülerleştirme (bakımkolaylığı temeli)
*Amaç: 968 satırlık `admin.route.ts` ve diğer monolitleri domain modüllerine böl; test güvenli.*
- ✅ **FAZ 1.1 — Admin route split (kullanıcılar+abonelik):** `admin/users.route.ts` (liste/detay+eylemler) + `admin/billing.route.ts` (fiyat/abonelik/CSV); ortak `audit`/`jsonOk`/`AdminAudit` → `admin/_shared.ts`. **YAPILDI (ADR-137).**
- ✅ **FAZ 1.2 — Admin route split (içerik+kanallar):** `admin/content.route.ts` (announcements/broadcast) + `admin/channels.route.ts` (channel-config/email-prompt). **YAPILDI (ADR-137).**
- ✅ **FAZ 1.3 — Admin route split (sistem+analitik+AI):** `admin/system.route.ts` (analytics/timeseries/traffic/providers/ops/growth/audit/system) + `admin/ai.route.ts` (model/embeddings). `admin.route.ts` artık yalnız composition (968→44 satır). **YAPILDI (ADR-137).**
- ✅ **FAZ 1.4 — Watcher/support route ayrımı:** `admin/watches.route.ts` + `admin/support.route.ts`. **YAPILDI (ADR-137).** _DÜRÜST: dedike per-modül test dosyası eklenmedi; mevcut `http.test.ts` taşınan rotaları (support akışı, timeseries, analytics) çalışma anında kapsar — ileride modül-bazlı testler eklenebilir._
- ✅ **FAZ 1.5 — Application katmanı denetimi:** `container.ts` 487→200 satır, `config/container/{types,builders,repositories}.ts`'e bölündü (db/in-memory tekrarlı literal → tek repo fabrikası); ölü kod ayıklandı (3 dosya: groq.assistant/deepseek.reasoner/groq.verifier + StaticAccessTokenProvider). Use-case dosyaları zaten küçüktü (en büyük 183 satır) → bölünmedi. **YAPILDI (ADR-138).**
- **Çıktı:** ✅ M1 TAMAM — Hiçbir route/config dosyası >300 satır (en büyük users.route.ts=200); her domain kendi route modülünde; composition root types/builders/repositories'e ayrıldı. Davranış DEĞİŞMEZ (saf refactor; 202 test geçti). _Kalan monolit denetimi (ör. app.ts) ileriki bakım turlarına._

## M2 — Ödeme & Abonelik (gelir hattı)
*Amaç: Stripe'ı canlıya al, planları dinamikleştir, fatura/iade/dunning ekle, TR alternatifi.*
- **FAZ 2.1 — Stripe canlı mod `[G]`:** hesap aktivasyonu sonrası `sk_live` + live fiyat/webhook; test→live geçiş kontrol listesi.
- ✅ **FAZ 2.2 — Plan özellik-maddeleri + şık kart:** abonelik ekranı Free/Pro karşılaştırma kartları (madde-madde, lucide Check), admin-yazılı **dile-özel** maddeler (app_settings, `admin/plan-features.tsx` dil seçici ×11) + i18n ×11 varsayılan. Migration YOK. **YAPILDI (ADR-139).**
- **FAZ 2.3 — Dinamik plan-builder `[M]`:** `plan_definitions` tablosu (slug/ad/Stripe price eşleme/özellikler); admin CRUD; entitlements DB'den. Migration izinli.
- **FAZ 2.4 — Fatura & makbuz:** Stripe invoice webhook → `invoices` kayıt; abonelik ekranında geçmiş + PDF link.
- **FAZ 2.5 — Dunning & yaşam döngüsü:** ödeme-başarısız (`invoice.payment_failed`) → uyarı bildirimi + grace; iptal/iade akışı; proration.
- **FAZ 2.6 — TR ödeme sağlayıcısı (iyzico/PayTR) `[G]`:** `PaymentGateway` portuna 2. adapter; admin'den sağlayıcı seçimi (Stripe vs TR). DÜRÜST: Stripe TR'ye ödeme yapmaz.

## M3 — RAG & Embeddings (doğruluk)
*Amaç: dormant embedding katmanını (ADR-127) gerçek RAG'e çevir.*
- **FAZ 3.1 — pgvector + embeddings tablosu `[M][G]`:** migration (extension + tablo); OpenAI/Gemini embed yazımı. (OPENAI_API_KEY Render'da hazır.)
- **FAZ 3.2 — Corpus indeksleme:** detection_events + check_runs.search_hits + site-policy notları → embed + upsert (batch worker).
- **FAZ 3.3 — `rag_retrieve` aracını gerçekle:** ajan + reasoner için benzerlik sorgusu (top-k); ADR-122 stub → gerçek.
- **FAZ 3.4 — Reasoner RAG-grounding:** reasoner istemine ilgili geçmiş bağlam; halüsinasyon/yanlış-pozitif azaltma ölçümü.

## M4 — Agentic Asistan Derinleştirme
*Amaç: ADR-129 fizibilite ajanını daha akıllı + ölçülebilir kıl.*
- **FAZ 4.1 — Araç genişletme:** `resolve_authority` + `check_site_policy` + RAG'i tek akışta; çok-kaynak doğrulama.
- **FAZ 4.2 — Maliyet/gecikme gözlemi:** tur sayısı/token/süre telemetrisi; admin'de "asistan sağlığı" paneli.
- **FAZ 4.3 — Değerlendirme seti (eval):** altın-soru kümesi; fizibilite kararı doğruluğu CI'da regresyon testi.
- **FAZ 4.4 — Canlı tool-calling doğrulama otomasyonu:** deepseek-v4-pro araç-desteği periyodik kontrol; Groq fallback metriği.

## M5 — Bildirim & Duyuru Sistemi
*Amaç: ADR-134/135 üzerine tam yönetim.*
- **FAZ 5.1 — Admin çok-dilli editör:** tek duyuruda çoklu-dil içerik (translations) sekmeli editör; otomatik-çeviri opsiyonu (LLM).
- **FAZ 5.2 — Zamanlanmış & hedefli duyuru:** ileri-tarihli yayın + segment hedefleme (plan/dil/ülke).
- **FAZ 5.3 — Okundu/etkileşim ölçümü:** sunucu-tarafı okuma kaydı; duyuru tıklama/CTA analitiği.
- **FAZ 5.4 — Sistem-bildirim şablonları kataloğu:** hediye dışında (limit-aşımı, plan-bitişi, deprem-uyarısı) ×11 şablonlar.

## M6 — Admin Konsol Olgunlaşma
*Amaç: her admin ekranını tutarlı, güçlü, RBAC'li yap.*
- 🟡 **FAZ 6.1 — Ekran-bazlı tutarlılık geçişi:** paylaşılan `Empty` atomic bileşeni + 6 liste ekranı boş-durum birleşimi (subs/watches/users/support/audit/announcements); 4-durum "boş" ayağı tek-tip. **KISMEN (ADR-140)** — pano grafik-içi + destek dizgesi boş hâli ileride.
- **FAZ 6.2 — Rol tabanlı erişim (RBAC):** admin/süper-admin/destek rolleri; route+UI yetki kapıları; audit zenginleştirme.
- **FAZ 6.3 — Global arama & hızlı eylemler:** kullanıcı/watcher/abonelik hızlı arama; klavye kısayolları (web).
- **FAZ 6.4 — Admin onboarding & yardım:** ilk-kullanım turu + her bölümde kısa açıklama.

## M7 — İzleme Hattı Güvenilirliği (çekirdek değer)
*Amaç: tespit doğruluğu + dayanıklılık.*
- **FAZ 7.1 — Kaynak çeşitliliği:** ek arama sağlayıcı + resmî-site canlı tarama iyileştirme; kaynak güven skoru.
- **FAZ 7.2 — Tekilleştirme & gürültü azaltma:** aynı olayın tekrar bildirimini engelle (semantik dedup + RAG).
- **FAZ 7.3 — Şüpheci verifier v2:** çok-turlu doğrulama + tarih/kaynak çapraz-kontrol metrikleri.
- **FAZ 7.4 — Scheduler dayanıklılık:** geri-basınç, yeniden-deneme, ölü-mektup; çoklu-süreç hazırlığı (pg-boss `[G]`).
- **FAZ 7.5 — Teslimat güvenilirliği:** kanal başarısızlık yeniden-deneme + kullanıcıya kanal-sağlık görünürlüğü.

## M8 — Mobil UX & Erişilebilirlik
*Amaç: AAA his + WCAG 2.2 AA tam uyum.*
- **FAZ 8.1 — Onboarding akışı:** ilk-açılış değer-anlatımı + örnek watcher + izin istekleri (bildirim).
- **FAZ 8.2 — Sihirbaz cilası:** fizibilite/detay kartları mikro-etkileşim + boş/hata durumları; klavye davranışı (ADR-131) genel denetim.
- **FAZ 8.3 — Erişilebilirlik denetimi:** kontrast/odak/ekran-okuyucu turu; reduce-motion her ekranda; biome a11y sıfır-uyarı.
- **FAZ 8.4 — Performans:** CWV/RAIL ölçümü; bundle bölme; liste sanallaştırma; görsel lazy-load.

## M9 — Gözlemlenebilirlik & Ops
*Amaç: "neyin bozulduğunu" anında gör.*
- ✅ **FAZ 9.1 — Yapısal log + korelasyon:** request-id uçtan uca + yapısal JSON + seviyeler ZATEN vardı; bu turda **PII redaksiyon kapısı** eklendi (`redactPii` — anahtar + string-desen; yakalanmayan-hata `stack`/`message` riskini kapatır). **YAPILDI (ADR-141).**
- 🟡 **FAZ 9.2 — Metrikler & sağlık:** teslimat **başarı oranı** göstergesi (dayanıklı DB; `deliveryHealth` util + ops baş göstergesi, ADR-142). **KISMEN** — LLM hata oranı (pencereli sayaç) + kuyruk derinliği (pg-boss v12 API belirsiz) ayrı turda.
- **FAZ 9.3 — Hata izleme `[G]`:** Sentry vb. entegrasyon (backend + mobil); sürüm etiketleme.
- **FAZ 9.4 — Uyarılar:** eşik-aşımı (hata oranı, kuyruk, ödeme webhook fail) → admin'e/Telegram'a alarm.

## M10 — Güvenlik & Uyumluluk
*Amaç: üretim-sınıfı güvenlik + KVKK/GDPR.*
- **FAZ 10.1 — RLS & yetki denetimi:** tüm tablolar için RLS gözden geçirme; gizlilik-zonu (PII vs paylaşılan) doğrulama testleri.
- **FAZ 10.2 — Secret rotasyon & en-az-yetki:** anahtar envanteri; rotasyon prosedürü; servis-hesabı kapsam daraltma.
- **FAZ 10.3 — KVKK/GDPR:** veri-ihracı (var, ADR-103) + silme/anonimleştirme + saklama politikası + rıza kayıtları.
- **FAZ 10.4 — Sıkılaştırma:** rate-limit ince ayar, bot/abuse guard, CSP/headers denetimi, dependency audit (CI).
- **FAZ 10.5 — Güvenlik incelemesi:** `/security-review` ile düzenli tur; tehdit modeli belgesi (ISO 27001).

## M11 — Test & Kalite
*Amaç: regresyonu kalıcı önle.*
- **FAZ 11.1 — Birim kapsam artışı:** kritik domain/application için kapsam hedefi; eksik dalları kapat.
- **FAZ 11.2 — E2E (mobil-web):** Playwright ile sihirbaz→watcher→bildirim akışı (gerçek-token render mümkün).
- **FAZ 11.3 — Sözleşme testleri:** contracts ↔ backend ↔ mobil tip/şema uçtan uca; kırıcı-değişiklik koruması.
- **FAZ 11.4 — Yük & dayanıklılık:** scheduler/checker yük testi; LLM/arama timeout senaryoları.

## M12 — Büyüme & Pazarlama
*Amaç: edinim + dönüşüm.*
- **FAZ 12.1 — Website/GEO güçlendirme:** `docs/GEO-pazarlama-mimarisi.md` uygulaması; statik içerik + IndexNow.
- **FAZ 12.2 — Referral/davet:** kullanıcı-davet + ödül (Pro hediye altyapısıyla bağlı, ADR-134).
- **FAZ 12.3 — Dönüşüm analitiği:** huni (kayıt→ilk watcher→Pro) ölçümü; admin'de görselleştirme.
- **FAZ 12.4 — Çok-dilli pazarlama:** açılış sayfaları ×N dil; mağaza metinleri.

---

## Önerilen sıralama (bağımlılık-temelli)
1. **M1 (modülerleştirme)** — sonraki her şeyin temeli; saf refactor, düşük risk.
2. **M2.1–2.2 (Stripe canlı + plan kartı)** — gelir + görünür değer.
3. **M6.1 (admin tutarlılık)** + **M9.1–9.2 (log/metrik)** — yönetilebilirlik.
4. **M3 (RAG)** `[M][G]` — doğruluk sıçraması (anahtar+migration hazır olunca).
5. **M7 (izleme güvenilirliği)** — çekirdek değer derinleşmesi.
6. **M10 (güvenlik/uyumluluk)** + **M11 (test)** — üretim sertleştirme (sürekli, paralel).
7. **M2.3–2.6, M4, M5, M8, M12** — olgunlaşma + büyüme.

## Dürüst sınırlar
- `[M]` fazları **açık migration izni** ister; `[G]` fazları **harici anahtar/hesap/karar** ister (Stripe canlı, Sentry, pg-boss, TR sağlayıcı).
- Tahmini efor/sıra önericidir; her faz başında ADM taraması + güncel ADR/EA ile doğrulanır.
- Bu yalnız PLAN'dır — hiçbir faz "yapıldı" değildir; uygulama sırasında gate yeşili + ADR ile işaretlenir.
