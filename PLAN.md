# PLAN — Auto-Shorts Studio

Bu doküman, verdiğin **her emri tek tek** ele alır: ne istendi, ne araştırdım/buldum, ne yaptım,
hangi kararı verdim. Sonunda araştırma bulguları (doğrulanmış) ve mimari var.

> Önemli not (oku): Bu bir **iskelet + spesifikasyon**tur, %100 bitmiş bir ürün değil. Çekirdek
> pipeline (Gemini, RAG, zamanlayıcı, YouTube yükleyici, uyumluluk) gerçek ve çalışır mantıkla
> yazıldı; dağıtım/derleme işlerini (APK, Supabase provisyon, Vercel/Render deploy, OAuth) Claude
> Code tamamlayacak — adımlar HANDOFF.md'de.

---

## 0) Dürüst uyarı — YouTube'un "bot savunması" kısmı (en kritik)

Sen "YouTube'un bot koruması için güzel bir savunma" istedin. İki yorumu var:

- **Atlatma/kandırma** (proxy havuzları, sahte izlenme/etkileşim, insan gibi görünme hileleri,
  algıyı yanıltma): bunu **yapmadım ve yapmam**. Hem YouTube politikalarını ihlal eder hem de
  kanalını kapattırır. Bu yönde kod yok.
- **Uyum + kalite + güvenli tempo** (gerçek savunma): bunu yaptım.

Neden bu kadar ciddi: Araştırmada doğruladım ki **YouTube Ocak 2026'da tarihinin en büyük
otomatik/yapay-zekâ kanalı kapatma dalgasını** gerçekleştirdi. Hedef profil tam olarak senin
tarifin: yüzsüz format, sentetik seslendirme, şablon senaryo, hacim odaklı yükleme. YouTube artık
kanalı **bütün olarak** değerlendiriyor (tek tek video değil): aynı format, editöryel parmak izi
olmayan AI anlatım, hacme göre kurulmuş yükleme takvimi → risk sinyali.

Bu yüzden pipeline **hayatta kalmak** üzere tasarlandı:
1. **İnsan onay adımı (human-in-the-loop), varsayılan AÇIK.** Sistem araştırır, taslağı yazar,
   doğrular, stil seçer ve **durur**; sen panelden onayla/düzelt. Otomasyon ağır işi yapar, editöryel
   ses sende kalır. Bu, "şablon AI içerik" damgasından kurtaran tek en önemli şey.
2. **Özgün yorum katmanı zorunlu** — kuru bilgi okumak değil, senin açın/analizin.
3. **Çeşitlilik** — her videoda görsel/ses/format değişir (STYLE_POOL), "hepsi aynı" desenini kırar.
4. **Düşük günlük tempo** (varsayılan 2/gün) + aralık — hacim değil kalite.
5. **AI ifşası** — her videoda açıklama satırı + API alanı denenir (SynthID zaten Gemini TTS'te).
6. **Özgünlük kontrolü** — yeni taslak son videolara çok benziyorsa (kosinüs) **reddedilir**.

Bunların hepsi `compliance.ts`, `scheduler.ts` ve worker'daki onay kapısında.

---

## 1) "Gemini key ile otomatikleştir + kanala yükle (short yap)"
- **Araştırma:** YouTube Data API v3 resmî yükleme yolu. `videos.insert` kotası **4 Aralık 2025'te
  1600 → ~100 birime** düşürüldü; varsayılan 10.000 birim/gün ile **günde ~100 yükleme** mümkün
  (eskiden ~6). OAuth kapsamı `youtube.upload`. Resumable upload `googleapis` ile.
- **Yapılan:** `packages/core/src/youtube.ts` — refresh-token OAuth, resumable yükleme, AI ifşa,
  zamanlanmış yayın. Worker (`apps/worker`) tüm akışı durum makinesiyle sürer.
- **Karar:** Üçüncü parti "otomatik yükleme" servisleri yerine resmî API — kanalının güvenliği için.

## 2) "Yazıları daha kaliteli yap"
- **Araştırma:** Güncel en güçlü modeller: **gemini-3.1-pro-preview** (en iyi muhakeme),
  **gemini-3.5-flash** (GA, hızlı+akıllı). `thinkingLevel: HIGH` zor görevler için.
- **Yapılan:** `scriptwriter.ts` senaryoyu **reasoning modeliyle + HIGH düşünme** üretir; RAG'dan
  doğrulanmış kaynak çeker, retention kalıbı (sert kanca, kısa beat'ler, payoff, CTA) ve **özgün
  yorum** zorlar; katı JSON döndürür. Çıktı insan onayına gider.
- **Karar:** Kalite için pahalı model + insan düzeltme adımı; "ucuz ve otomatik" yerine "iyi".

## 3 & 12) "Gündüz saatlerinde rastgele saatlerde + belli bir seed sistemiyle paylaş"
- **Yapılan:** `scheduler.ts` — `mulberry32` tohumlu PRNG. (tarih, seed) → **deterministik ama
  rastgele görünen** gündüz slotları; saat penceresi (varsayılan 09–21), min aralık, günlük tavan,
  saniye-jitter. Aynı seed → aynı plan (panelde önizlenebilir, restart'a dayanıklı).
- **Karar:** Bu meşru "dağıtma" jitter'ı; algı kandırma değil. Tavan bilinçli düşük.

## 4) "Gemini ile okusun + metni temiz/kaliteli hazırlasın"
- **Araştırma:** **gemini-3.1-flash-tts-preview** — 70+ dil (Türkçe dahil), 30 hazır ses, doğal dil
  ile stil/aksan/tempo kontrolü, **SynthID filigranı** (AI içeriği işaretler). Interactions API,
  `response_modalities:['audio']`.
- **Yapılan:** `gemini.ts` → `tts()` (REST, doğrulanmış payload), `video.ts` seslendirmeyi üretip
  videoya gömer. Metin hazırlığı (1) ve (2)'deki scriptwriter ile.
- **Karar:** SynthID filigranı ifşa açısından bir artı; seste stil "narrator" olarak yönlendiriliyor.

## 5) "Arama (search grounding) açık olsun"
- **Araştırma:** **Grounding with Google Search** (`tools:[{googleSearch:{}}]`), kaynak atıflı.
  Gemini 3.x'te **arama + function calling birlikte** kullanılabilir.
- **Yapılan:** `gemini.generate({ search:true })`; scriptwriter taze/ek detay için açıyor.

## 6) "Function calling açık olsun"
- **Yapılan:** `gemini.generate({ functions:[...] })`. Scriptwriter `claim_topic` fonksiyonunu çağırır
  (hangi konuyu işlediğini kaydeder → tekrar önlenir). Genişletmek için functions dizisine ekle.

## 7) "Embedding açık olsun"
- **Araştırma:** **gemini-embedding-001** (`embedContent`), boyut ayarlanabilir (Matryoshka:
  768/1536/3072). Varsayılan 768 (pgvector verimli).
- **Yapılan:** `gemini.embed()`; RAG ve memory bunu kullanır. `EMBED_DIM` env ↔ `vector(N)` şema.

## 8) "Kaliteli RAG sistemi"
- **Yapılan:** Supabase **pgvector** üstünde self-hosted RAG (`rag.ts` + `schema.sql`): doğrulanmış
  bilgi parçaları → embedding → HNSW kosinüs arama (`match_knowledge`). Senaryo yalnız **verified**
  parçalardan beslenir (yanlış-bilgi koruması). Tohum verisi `data/knowledge.seed.json`.
- **Alternatif:** Gemini'nin yönetilen **File Search** RAG'ı da var; kontrolü ve "Knowledge" sayfasını
  istediğimiz için pgvector seçildi. İstersen File Search'e geçilebilir (PLAN ek).

## 9) "Bellek"
- **Yapılan:** `memory.ts` + `memory` tablosu — tercihler, analizden öğrenilen performans içgörüleri,
  kullanılmış konu defteri. Semantik geri çağırma (`match_memory`). "Memory" sayfasında görünür.

## 10) "İstatistiksel grafik paneli"
- **Yapılan:** `apps/web/app/analytics` — YouTube Data API'den görüntülenme/beğeni/yorum, toplamlar +
  **recharts** çubuk grafik (`components/ViewsChart.tsx`). Worker `refreshAnalytics()` ile `analytics`
  tablosunu günceller.

## 11) "Her biri ayrı sayfa"
- **Yapılan:** Next.js çok sayfa: **Dashboard, Queue/Approval, Knowledge (RAG), Memory, Analytics,
  Settings** — her biri ayrı route, ortak sidebar. Tasarım: koyu "haber odası + kontrol odası" teması
  (jenerik AI görünümünden kaçınıldı).

## 13) "YouTube bot savunması" → bkz. **§0** (dürüst uyum stratejisi).

## 14) "Her emri ayrı incele, planla, araştır" → bu doküman.

## 15) "Claude Code: APK, Supabase, Vercel front+back, Render, keyler, YouTube + internet açıklık,
hesaba entegrasyon" → **HANDOFF.md** (sıralı runbook).

## 16) "Uygulama sadece benim için, halka açık değil"
- **Karar/öneri:** Tek kullanıcı. Kilitleme seçenekleri (HANDOFF §6): (a) Supabase Auth + tek-email
  allowlist, (b) Vercel "Password Protection"/"Vercel Authentication", (c) basit paylaşılan parola
  middleware. Service-role anahtarı yalnız sunucu/worker'da; tarayıcıya asla.

---

## Araştırma bulguları (Haziran 2026, web ile doğrulandı)

**Gemini modelleri:** gemini-3.5-flash (GA, en iyi Flash), gemini-3.1-pro-preview (en iyi muhakeme),
gemini-3.1-flash-lite (ucuz/yüksek hacim). Görsel: "Nano Banana 2" = gemini-3.1-flash-image-preview,
"Nano Banana Pro" = gemini-3-pro-image-preview (image-preview'lar ~25 Haz 2026 kullanımdan kalkıyor →
GA muadiline pinle). Gemini 2.0 modelleri 1 Haz 2026'da kapandı. Tüm model id'leri env'den okunuyor.

**TTS:** gemini-3.1-flash-tts-preview — 70+ dil (Türkçe), 30 ses, audio tag'leri, SynthID filigranı.

**Embedding:** gemini-embedding-001, boyut 768/1536/3072.

**Tools:** Google Search grounding + function calling Gemini 3.x'te birleştirilebilir; ayrıca yönetilen
File Search RAG mevcut.

**YouTube kotası:** `videos.insert` 4 Ara 2025'te 1600 → ~100 birim; 10.000/gün ile ~100 yükleme/gün.
OAuth `youtube.upload` (+ `youtube.readonly` istatistik için). Resumable upload.

**YouTube AI politikası:** "Altered/Synthetic content" ifşası gerçekçi sentetik medya için zorunlu;
**ifşa dağıtımı/monetizasyonu DÜŞÜRMEZ** — gizlemek ceza getirir. Ayrı "inauthentic content" politikası
(Tem 2025'te "repetitious"tan yeniden adlandırıldı) kitlesel/şablon/insan-girdisiz içeriği hedefler;
**Ocak 2026'da büyük kanal kapatma dalgası** bu profili vurdu. Bu yüzden §0'daki tasarım.

---

## Mimari (özet)

```
Topics (knowledge) ─▶ Scriptwriter (Gemini reasoning + RAG + Search + functions)
                         │  strict JSON ShortScript (+ original commentary)
                         ▼
                  Compliance gate (originality, variation, disclosure, cap)
                         │
                         ▼
              ┌── needs_review ──▶ [SEN: panelde onay/düzelt] ──┐
              │                                                  ▼
              └──────────────────────────────────────────▶  approved
                                                                 │
                              Gemini TTS narration + Gemini images
                                                                 ▼
                                  ffmpeg → 1080x1920 mp4 (captions, Ken-Burns)
                                                                 │
                          Scheduler (seeded daytime slot) → scheduled
                                                                 ▼
                        YouTube Data API v3 upload (disclosure) → published
                                                                 ▼
                         YouTube stats → analytics table → dashboard chart
```

- **web** (Vercel): 6 sayfa + API route'ları (onay, knowledge, settings).
- **worker** (Render, Docker+ffmpeg): durum makinesi, cron `tick` veya `loop`.
- **core** (`@studio/core`): tüm pipeline beyni (paylaşılan TS kütüphane).
- **Supabase**: Postgres + pgvector (knowledge, memory, video_jobs, analytics, config) + Storage.

## Video kalitesi — yükseltme yolu
Varsayılan ffmpeg (her yerde çalışır). Stüdyo kalitesi için **Remotion** (React tabanlı, kare-hassas
altyazı/animasyon) `renderVideo()` yerine konabilir; `/remotion` ve §5 not. Tüm görseller AI-üretimi/
özgün veya senin varlıkların — telifli medya kazımak yok.
