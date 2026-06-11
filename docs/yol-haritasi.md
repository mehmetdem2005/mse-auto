# Whenly — Geliştirme Yol Haritası

> Madde madde, önceliklendirilmiş, **dürüst yapabilirlik notlu** plan. Her madde:
> NE · NEDEN (gerçek değer) · NASIL · YAPABİLİRLİK/RİSK · BÜYÜKLÜK (S/M/L) · BAĞIMLILIK.
> Öncelik: **P0** şimdi · **P1** yakın · **P2** sonra · **P3** vizyon.
> Tarih: 2026-06-11 · Kaynak: ADR-001..074, docs/gercek-talepler.md, docs/ajan-mimarisi.md.

## Durum (tamamlanan ana hatlar)
İmza UI kabuğu · 11 dil i18n · koyu tema · toast/sheet/haptics · saha araştırması (50 talep) ·
hazır öneriler (evrensel, hardcode'suz) · ajan mimarisi A1 Doğrulayıcı + A2 Eskalasyon ·
JS-render fetch altyapısı · asistan uydurma-yasağı + yapabilirlik dürüstlüğü.

---

## 1. TESPİT MOTORU & AI KALİTESİ (ürünün kalbi)

- **[P0] A4 — Eval/golden-set düzeneği** · NE: 20-50 gerçek topic + beklenen sonuç + beklenen araç-izi; `pnpm eval`. NEDEN: bundan sonraki HER iyileştirmenin etkisini sayıyla görmek (şu an kör uçuyoruz). NASIL: LLM-as-judge (0-1 rubrik: doğruluk/güncellik/tekrar) + mevcut 👍/👎 verisi. RİSK: düşük. BÜYÜKLÜK: M. (ADR-060 A4)
- **[P1] A0 — Guardrail'leri tek modülde açık koda dök** · NE: max-tur + token-bütçe + timeout + ilerleme-yok, run-topic-check'te açık. NEDEN: maliyet/sonsuz-döngü güvenliği (sektörde 47.000$ olayı). RİSK: düşük. BÜYÜKLÜK: S.
- **[P1] A3 — Token/span izleri** · NE: check_runs'a token sayaçları + adım span'leri (OTel GenAI adlandırması). NEDEN: maliyet görünürlüğü + karar-kalıbı teşhisi. BÜYÜKLÜK: M.
- **[P2] A5 — Model routing** · NE: worker/karar=ucuz, doğrulayıcı=güçlü model. NEDEN: maliyet/kalite dengesi. BÜYÜKLÜK: S.
- **[P1] Kaynak-çözümleme derinleştirme** · NE: konuya göre resmî kaynağı daha iyi bul (authority resolver güçlendir); çok-sayfa tarama. NEDEN: tespit isabeti. RİSK: orta. BÜYÜKLÜK: M.
- **[P2] Tekrar-bildirim hassasiyeti** · NE: aynı olayın farklı kelimelerle tekrarını LLM + gömü (embedding) ile yakala. NEDEN: kullanıcı aynı şeyi 2 kez almasın. BÜYÜKLÜK: M.

## 2. YAPABİLİRLİK GENİŞLETME (taleplerin çoğunu gerçek kıl)

- **[P0] JS-render'ı canlıda etkinleştir + test** · NE: bir render-proxy anahtarı (ScrapingBee/Browserless) bağla, dinamik sayfaları doğrula. NEDEN: stok/fiyat/JS-duyuru talepleri ancak böyle çalışır. YAPABİLİRLİK: altyapı HAZIR (ADR-070), anahtar + test lazım. RİSK: maliyet (servis ücreti). BÜYÜKLÜK: S.
- **[P1] Dolaylı tespit (login/portal duvarları için)** · NE: randevu/stok sistemini doğrudan okumak yerine "açıldı" sinyalini haber/duyuru/sosyal'den yakala. NEDEN: vize/MHRS gibi talepleri KISMEN çalışır kılar (dürüst: doğrudan portal değil). BÜYÜKLÜK: M.
- **[P2] Yapılandırılmış fact-provider'lar** · NE: fiyat (e-ticaret/uçak API), SSL/WHOIS (domain/sertifika süresi), kur/borsa API. NEDEN: bu dikeyler web-araması yerine API ile GÜVENİLİR çalışır. YAPABİLİRLİK: her biri ayrı port+adapter. BÜYÜKLÜK: L (dikey başına S/M).
- **[P2] Resmî besleme entegrasyonları** · NE: Resmî Gazete, EKAP, RSS/Atom akışları için özel adaptörler. NEDEN: en güvenilir tespit; kurumsal talepler. BÜYÜKLÜK: L.
- **[P3] Sosyal medya izleme** · NE: marka mention için sosyal API. NEDEN: kurumsal marka-kriz talebi. RİSK: API erişim/maliyet/politika. BÜYÜKLÜK: L.

## 3. BİLDİRİM & TESLİMAT

- **[P0] Gerçek push (FCM) uçtan uca test** · NE: gerçek cihazda kayıt→tespit→push doğrula. NEDEN: ürünün TEK çıktısı bildirim; çalıştığını kanıtla. YAPABİLİRLİK: kod var, EAS derleme + cihaz gerekir. BÜYÜKLÜK: M.
- **[P1] Çok-kanal teslimat** · NE: e-posta (P0 kolay) → Telegram bot → WhatsApp (Cloud API). NEDEN: saha araştırması: kullanıcılar farklı kanal istiyor; push kaçırılır. YAPABİLİRLİK: e-posta/Telegram kolay, WhatsApp onay süreci ister. BÜYÜKLÜK: kanal başına S/M.
- **[P1] Sessiz saatler + dijest** · NE: gece bildirim erteleme; düşük-aciliyetli olayları günlük özet. NEDEN: bildirim yorgunluğu. BÜYÜKLÜK: S.
- **[P2] Aciliyet seviyeleri** · NE: kritik=anında+alarm, normal=push, düşük=dijest. NEDEN: doğru şeyi doğru zamanda. BÜYÜKLÜK: S.

## 4. KİŞİSELLEŞTİRME & FİLTRE

- **[P1] Cihaz-içi filtre olgunlaştırma** · NE: geo/numeric/keyword eşleşmesini gerçek senaryolarla test + UI iyileştir. NEDEN: gizlilik (kriter cihazdan çıkmaz) + isabet. YAPABİLİRLİK: temel var. BÜYÜKLÜK: M.
- **[P2] Watcher düzenleme** · NE: oluşturulmuş watcher'ın niyet/sıklık/filtre düzenlenmesi (şu an sadece duraklat/sil). NEDEN: temel kullanılabilirlik. BÜYÜKLÜK: M.
- **[P2] Watcher şablonları/paylaşımı** · NE: kullanıcı kendi şablonunu kaydet/paylaş. NEDEN: yapışkanlık. BÜYÜKLÜK: M.

## 5. PARA KAZANMA & ABONELİK

- **[P1] Ödeme entegrasyonu** · NE: gerçek ödeme (iyzico/Stripe) → Pro yükseltme. NEDEN: gelir; UI'da "yakında" sözü var. YAPABİLİRLİK: sağlayıcı seçimi + KVKK/PCI. RİSK: orta-yüksek. BÜYÜKLÜK: L.
- **[P2] Fatura geçmişi (gerçek)** · NE: ödeme entegrasyonu sonrası gerçek fatura listesi/indirme. BAĞIMLILIK: ödeme. BÜYÜKLÜK: S.
- **[P2] Plan limitleri ince-ayar** · NE: kurumsal plan katmanı (B2B talepleri için daha çok watcher/sık tarama). NEDEN: saha: kurumsal değer yüksek. BÜYÜKLÜK: S.

## 6. ARAYÜZ / UX (kalanlar)

- **[P1] Onboarding turu** · NE: ilk açılışta 2-3 ekran değer anlatımı + ilk watcher'a yönlendirme. NEDEN: ilk-kullanım kaybı. BÜYÜKLÜK: S.
- **[P2] Native Inter (Android)** · NE: expo-font ile gerçek font (web'de var). NEDEN: tipografi tutarlılığı. RİSK: derleme. BÜYÜKLÜK: S.
- **[P2] Bildirim merkezi/geçmiş** · NE: gelen tüm bildirimlerin tarihçesi (Akış'tan ayrı). NEDEN: kaçırılan bildirime erişim. BÜYÜKLÜK: M.
- **[P2] Boş durum illüstrasyonları + mikro-içerik** · NE: her boş ekrana yönlendirici görsel/metin. BÜYÜKLÜK: S.

## 7. GÜVEN & GÖZLEMLENEBİLİRLİK

- **[P1] Doğruluk metriği panosu** · NE: admin'de tespit isabeti/yanlış-pozitif oranı (👍/👎 + doğrulayıcı-red verisinden). NEDEN: kaliteyi yönet. BAĞIMLILIK: A4. BÜYÜKLÜK: M.
- **[P2] Kullanıcı geri-bildirim döngüsü** · NE: 👎 alan tespitleri insan-inceleme kuyruğuna → golden-set'e. NEDEN: sürekli iyileşme. BÜYÜKLÜK: M.

## 8. GÜVENLİK & UYUM

- **[P1] /security-review turu** · NE: RLS denetimi (PII zonları), rate-limit, prompt-injection (kullanıcı niyeti → reasoner), SSRF (origin fetch). NEDEN: güven + yasal. BÜYÜKLÜK: M.
- **[P1] KVKK/GDPR tamamlama** · NE: veri saklama/silme akışları gerçek (hesap silme var), aydınlatma metni, veri ihracı. NEDEN: yasal zorunluluk + saha: kurumsal kullanıcı sorar. BÜYÜKLÜK: M.

## 9. PERFORMANS & ÖLÇEK

- **[P2] Tarama kuyruğu ölçeklendirme** · NE: çok sayıda watcher'da scheduler/queue yük testi + batching. NEDEN: büyüme. BÜYÜKLÜK: M.
- **[P2] Maliyet kontrolü** · NE: LLM+arama+render maliyet izleme + watcher başına bütçe. BAĞIMLILIK: A3. BÜYÜKLÜK: M.
- **[P2] Önbellek** · NE: aynı topic'i izleyen N kullanıcı için tek tarama (zaten canonical topic var — doğrula/derinleştir). BÜYÜKLÜK: S.

## 10. PLATFORM & DAĞITIM

- **[P1] Android EAS derleme + Play yayını** · NE: gerçek APK, push + haptics + native font orada çalışır. NEDEN: asıl ürün mobil. BÜYÜKLÜK: M.
- **[P2] Web SEO/hreflang** · NE: çok-dilli SEO (şu an tek lang). NEDEN: global organik erişim. BÜYÜKLÜK: S.

---

## Önerilen ilk 5 (en yüksek değer/risk oranı)
1. **A4 eval düzeneği** (P0,M) — kaliteyi ölçülebilir kıl; her şeyin temeli.
2. **JS-render canlı etkinleştirme** (P0,S) — altyapı hazır, taleplerin çoğunu açar.
3. **Gerçek push uçtan uca test** (P0,M) — ürünün tek çıktısını kanıtla.
4. **A0 guardrail'ler** (P1,S) — maliyet güvenliği, küçük iş.
5. **Çok-kanal: e-posta + Telegram** (P1,S) — bildirim güvenilirliği, saha talebi.

## Dürüst genel not
- **Login/portal arkası** (randevu/stok booking) hiçbir planla %100 doğrudan çözülmez — en iyi yol **dolaylı tespit** (#2) + **render-proxy** (kısmi). Bunu kullanıcı beklentisinde net tut.
- **Ödeme** ve **çok-kanal WhatsApp** dış onay/uyum süreçleri içerir — kod hazır olsa bile takvim dışsala bağlı.
- Bu plan canlı belge; her tamamlanan madde ADR + bu dosyada işaretlenir.
