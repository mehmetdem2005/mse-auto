# Whenly — Büyüme & Vizyon Planı (Faz 2)

> `docs/yol-haritasi.md` operasyonel çekirdeği (kategori 1–10) kapsar. Bu belge
> **stratejik/uzun-vadeli** katmanı ekler (11–24): büyüme, platform, iş modeli,
> kalite-mühendisliği, ileri-AI. Format: NE · NEDEN · NASIL · RİSK · BÜYÜKLÜK (S/M/L).
> Öncelik: P1 yakın · P2 sonra · P3 vizyon. Tarih: 2026-06-11.

---

## 11. BÜYÜME & EDİNİM
- **[P2] Davet/referral döngüsü** · NE: "arkadaşını davet et, +1 watcher". NEDEN: organik büyüme, sıfır-maliyet edinim. NASIL: davet kodu + ödül; mevcut plan-limiti altyapısına bağlanır. RİSK: kötüye kullanım (sahte hesap) → e-posta doğrulama. BÜYÜKLÜK: M.
- **[P2] Paylaşılabilir watcher/tespit kartı** · NE: bir tespiti görsel kart olarak paylaş (WhatsApp/X). NEDEN: viral döngü + sosyal kanıt. NASIL: OG-image üretimi (sunucu) + derin link. BÜYÜKLÜK: M.
- **[P2] Herkese açık "trend izlemeler" galerisi** · NE: en çok izlenen kamusal konular (anonim). NEDEN: keşif + SEO + "ben de izleyeyim". NASIL: canonical_topic sayaçları (zaten paylaşımlı topic var). RİSK: gizlilik → yalnız kamusal/shared. BÜYÜKLÜK: M.
- **[P3] SEO içerik motoru** · NE: "X ne zaman açıklanacak?" tarzı dinamik landing sayfaları. NEDEN: yüksek-niyetli organik trafik (saha araştırmasındaki arama davranışı). NASIL: topic→SSR sayfa + güncel tespit. BÜYÜKLÜK: L.

## 12. AKTİVASYON & ELDE TUTMA
- **[P1] Aktivasyon hunisi ölçümü** · NE: kayıt→ilk-watcher→ilk-bildirim süresi metriği. NEDEN: nerede kaybediyoruz görmek. NASIL: olay loglama + admin pano. BAĞIMLILIK: A4/A3. BÜYÜKLÜK: M.
- **[P2] Win-back** · NE: bildirim gelmeyen/pasif kullanıcıya "izlemelerin sessiz, güncelleyelim mi". NEDEN: churn azalt. BÜYÜKLÜK: S.
- **[P2] İlk-değer hızlandırma** · NE: onboarding'de gerçekten hızlı tetiklenen bir örnek watcher öner (kanıtlı çalışan kategori). NEDEN: "aha anı"nı öne çek. BAĞIMLILIK: A4 (hangi kategori güvenilir biliniyor). BÜYÜKLÜK: S.
- **[P3] Streak/alışkanlık** · NE: aktif izleme serisi, haftalık özet e-postası. NEDEN: geri-getirme. BÜYÜKLÜK: M.

## 13. TOPLULUK & AĞ ETKİSİ
- **[P2] "N kişi bunu izliyor" sinyali** · NE: popüler konuda sosyal kanıt. NEDEN: güven + dönüşüm. NASIL: shared topic abone sayısı. BÜYÜKLÜK: S.
- **[P3] Watcher koleksiyonları/paketleri** · NE: "Üniversite adayı paketi", "İhale takip paketi" — tek dokunuşla N watcher. NEDEN: kurumsal + niş kitleler. BÜYÜKLÜK: M.
- **[P3] Topluluk kaynak önerisi** · NE: kullanıcılar bir konu için iyi resmî kaynağı işaretler. NEDEN: kaynak-çözümleme kalitesi (insan-destekli). RİSK: spam/denetim. BÜYÜKLÜK: M.

## 14. VERİ & ML
- **[P2] Kategori sınıflandırma (deterministik+LLM)** · NE: watcher'ı otomatik kategoriye ata (mevcut categoryOf'u güçlendir). NEDEN: filtreleme, analitik, kaynak seçimi. BÜYÜKLÜK: S.
- **[P3] Kişiselleştirilmiş öneri** · NE: kullanıcının izlemelerine göre yeni watcher öner. NEDEN: yapışkanlık. BAĞIMLILIK: yeterli veri. BÜYÜKLÜK: M.
- **[P3] Akıllı sıklık (öğrenen)** · NE: olay hiç değişmiyorsa tarama seyrelt, hareketliyse sıklaştır. NEDEN: maliyet + isabet. NASIL: tespit geçmişinden adaptif frekans. BÜYÜKLÜK: M.
- **[P3] Anomali/tahminsel bildirim** · NE: "bu konu genelde X tarihinde açıklanır, yaklaşıyor". NEDEN: proaktif değer. RİSK: yanlış tahmin güveni sarsar. BÜYÜKLÜK: L.

## 15. KURUMSAL / B2B ÜRÜN (saha: yüksek değer)
- **[P2] Takım hesapları** · NE: çok kullanıcı, paylaşılan watcher'lar, roller. NEDEN: kurumsal talep (ihale/mevzuat/rakip ekipçe izlenir). NASIL: org modeli + RLS genişletme. RİSK: orta (yetki/veri izolasyonu). BÜYÜKLÜK: L.
- **[P2] Webhook çıkışı** · NE: tespit → müşterinin sistemine HTTP POST (Slack/Teams/kendi backend). NEDEN: kurumsal entegrasyon; en istenen B2B özelliği. NASIL: imzalı webhook (zaten gelen webhook var, çıkış ekle). BÜYÜKLÜK: M.
- **[P3] White-label / gömülü** · NE: marka değiştirilebilir izleme. NEDEN: ajans/SaaS yeniden satış. BÜYÜKLÜK: L.
- **[P3] SLA + öncelikli tarama** · NE: kurumsal planda garanti sıklık/uptime. BÜYÜKLÜK: M.

## 16. GELİŞTİRİCİ PLATFORMU
- **[P2] Public REST API + anahtar** · NE: watcher CRUD + tespit çekme API'si. NEDEN: ekosistem, B2B entegrasyon. NASIL: mevcut Hono route'ları + API-key auth katmanı. BÜYÜKLÜK: M.
- **[P3] Zapier/Make/n8n connector** · NE: kod-yazmadan otomasyon. NEDEN: erişim genişliği. BAĞIMLILIK: public API. BÜYÜKLÜK: M.
- **[P3] MCP server** · NE: Whenly'yi AI ajanlarına araç olarak aç. NEDEN: AI-native dağıtım kanalı. BÜYÜKLÜK: M.

## 17. BİLDİRİM ZEKASI
- **[P2] "Neden bu bildirim" açıklaması** · NE: bildirimde kısa gerekçe + kaynak linki. NEDEN: güven (kullanıcı doğrulayabilsin). NASIL: reasoning+hit zaten var, teslimat mesajına ekle. BÜYÜKLÜK: S.
- **[P2] Akıllı gruplama/özet** · NE: kısa sürede çok tespit → tek özet bildirim. NEDEN: yorgunluk. BÜYÜKLÜK: M.
- **[P3] Önem tahmini** · NE: tespitin kullanıcı için önemini skorla, sıralamayı/aciliyeti ayarla. BÜYÜKLÜK: M.

## 18. ULUSLARARASILAŞMA DERİNLİĞİ
- **[P2] Bölgesel kaynak farkındalığı** · NE: kullanıcı diline/bölgesine göre resmî kaynak/haber önceliği. NEDEN: yabancı kullanıcıda isabet (hardcode'suz, sinyal-temelli). RİSK: orta. BÜYÜKLÜK: M.
- **[P2] Yerel tarih/para/sayı tam** · NE: tüm formatlar aktif dilden (büyük kısmı yapıldı, denetle). BÜYÜKLÜK: S.
- **[P3] RTL tam aynalama** · NE: Arapça düzen aynalama (metin çevrildi, layout değil). NASIL: I18nManager + yön-bağımsız stiller. BÜYÜKLÜK: M.

## 19. ERİŞİLEBİLİRLİK & KAPSAYICILIK
- **[P1] Ekran okuyucu uçtan-uca testi** · NE: TalkBack/VoiceOver ile tüm akışlar. NEDEN: AA+ gerçek doğrulama (kod var, gerçek test yok). BÜYÜKLÜK: M.
- **[P3] Sesli watcher oluşturma** · NE: konuşarak niyet tanımla. NEDEN: erişilebilirlik + kolaylık. BÜYÜKLÜK: M.

## 20. OPERASYON & GÜVENİLİRLİK
- **[P1] Uptime + hata izleme** · NE: backend/worker sağlık + alarm (Sentry/log). NEDEN: tespit kaçırma = ürün başarısızlığı. BÜYÜKLÜK: M.
- **[P2] Durum sayfası** · NE: kamusal status page. NEDEN: kurumsal güven. BÜYÜKLÜK: S.
- **[P2] Yedekleme/DR** · NE: DB yedek + kurtarma provası. NEDEN: veri kaybı riski. BÜYÜKLÜK: M.
- **[P2] Worker dayanıklılık** · NE: tarama job'u hatadan devam (resume), ölü-mektup kuyruğu. NEDEN: kaçırılan tarama. BÜYÜKLÜK: M.

## 21. YASAL & GÜVEN
- **[P1] ToS + Gizlilik + Çerez** · NE: gerçek hukuki metinler (UI'da "kabul ediyorsun" var, metin yok). NEDEN: yayın zorunluluğu. BÜYÜKLÜK: S (metin) + dış (hukuk).
- **[P1] Veri ihracı/silme tam** · NE: KVKK/GDPR "verimi indir" + silme (silme var, ihraç yok). BÜYÜKLÜK: M.

## 22. TEST & KALİTE MÜHENDİSLİĞİ
- **[P1] E2E akış testleri** · NE: kayıt→watcher→tespit→bildirim kritik yolu otomatik. NEDEN: regresyon kalkanı (96 birim test var, E2E yok). NASIL: Playwright (web). BÜYÜKLÜK: M.
- **[P2] Kontrat testleri** · NE: backend↔mobil @watcher/contracts uyumu CI'da. NEDEN: kırılma erken yakala. BÜYÜKLÜK: S.
- **[P2] Yük testi** · NE: scheduler/queue çok-watcher altında. BAĞIMLILIK: #9. BÜYÜKLÜK: M.
- **[P3] Görsel regresyon** · NE: ekran görüntüsü diff (tema/dil matrisi). BÜYÜKLÜK: M.

## 23. MALİYET & BİRİM EKONOMİ
- **[P2] Watcher başına maliyet modeli** · NE: LLM+arama+render maliyetini watcher/kullanıcı başına ölç. NEDEN: freemium sürdürülebilirliği. BAĞIMLILIK: A3. BÜYÜKLÜK: M.
- **[P2] Bütçe-farkında tarama** · NE: ücretsiz planda toplam aylık tarama bütçesi. NEDEN: maliyet kontrolü. BÜYÜKLÜK: S.

## 24. AI AJAN OLGUNLAŞMA (ADR-060 ötesi)
- **[P3] Kendi-kendine kaynak keşfi** · NE: ajan bir konu için en iyi resmî kaynağı kendi bulup doğrulasın. NEDEN: isabet + otomasyon. BÜYÜKLÜK: L.
- **[P3] Çok-watcher orkestrasyonu** · NE: ilişkili watcher'ları tek bağlamda değerlendir (ör. aynı sınavın 3 aşaması). NEDEN: tutarlılık + maliyet. BÜYÜKLÜK: L.
- **[P3] Açıklanabilir karar günlüğü** · NE: her tespitin tam ajan-izi kullanıcıya/denetime açık. NEDEN: güven + hata ayıklama. BAĞIMLILIK: A3. BÜYÜKLÜK: M.

---

## YÜRÜTME DALGALARI (her ikisi planın birleşimi)

**Dalga 1 — "Kanıtla & ölç" (temel sağlamlık)**
A4 eval · A0 guardrail · gerçek push test · JS-render canlı · uptime izleme · ToS/gizlilik metni.
→ Çıktı: kalite ölçülebilir, ürün çıktısı kanıtlı, temel güven.

**Dalga 2 — "Güvenilir bildirim" (çekirdek değer)**
Çok-kanal (e-posta+Telegram) · "neden bu bildirim" · sessiz saatler/dijest · dolaylı tespit · A3 token izleri · E2E testler.
→ Çıktı: bildirim gerçekten güvenilir + şeffaf (saha #1 bulgusu).

**Dalga 3 — "Gelir & kurumsal"**
Ödeme + fatura · takım hesapları · webhook çıkışı · kurumsal plan · doğruluk panosu.
→ Çıktı: para kazanma + B2B (saha: en yüksek değer kümesi).

**Dalga 4 — "Büyüme & platform"**
Referral · paylaşılabilir kart · trend galerisi · public API · onboarding+aktivasyon ölçümü.
→ Çıktı: organik büyüme motoru + ekosistem.

**Dalga 5 — "Akıllı & ölçek"**
Akıllı sıklık · kişiselleştirilmiş öneri · kendi-kendine kaynak keşfi · yük/DR · Android Play yayını.
→ Çıktı: maliyet-verimli, akıllı, ölçeklenen ürün.

## Dürüst genel sınırlar (tekrar)
- Login/portal arkası talepler hiçbir dalgada %100 doğrudan çözülmez (dolaylı tespit + render-proxy = kısmi).
- Ödeme, WhatsApp, white-label, hukuki metinler **dış onay/uzmanlık** gerektirir — kod hazır olsa da takvim dışsala bağlı.
- ML maddeleri (tahmin/anomali) yeterli veri biriktikten sonra anlamlı — erken yapmak spekülasyon olur.
- Her madde tamamlanınca ADR + ilgili yol-haritası dosyasında işaretlenir; bu belge canlıdır.
