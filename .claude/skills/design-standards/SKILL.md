---
name: design-standards
description: Tüm kodlama/UI işlerinde uygulanacak tasarım, frontend mimari, CSS, erişilebilirlik, state, performans + kurumsal mimari (TOGAF ADM) + ISO kalite/güvenlik (42010/25010/25012/27001-27002/29148/9241) standartları. Watcher (mobil + dashboard + backend) dahil her arayüz/kod görevinde zorunlu. Çıktının sonunda uygulanan standartlar + TOGAF + ISO raporu listelenir.
---

# Design & Engineering Standards

Bu skill, **her kodlama/arayüz işinde** uyulması gereken standartları uygulanabilir kurallara çevirir.
İşin sonunda mutlaka bir **"Standartlar"** dipnotu ile o işte fiilen uygulanan maddeler listelenir.

## Nasıl kullanılır
1. Göreve başlamadan ilgili bölümleri tara, hangi standartların geçerli olduğunu belirle.
2. Kodu bu kurallara göre yaz (uymadığın yeri gerekçelendir).
3. Görev sonunda **"Standartlar"** başlığıyla uyguladıklarını madde madde yaz.

---

## 1. UI/UX Tasarım Sistemleri
- **Atomic Design:** bileşenleri atoms → molecules → organisms → templates → pages olarak ayır. Mobil: `src/components/{atoms,molecules,organisms}`. Tek sorumluluk; küçük, kompoze edilebilir parçalar.
- **8pt Grid:** tüm spacing/boyut 4 veya 8'in katı (4,8,12,16,24,32...). Rastgele px yok.
- **Material (Android):** dokunsal geri bildirim (ripple/press state), elevation/gölge hiyerarşisi, FAB/bottom-nav kalıpları.
- **HIG (iOS):** safe-area, dinamik tip, büyük başlık, native his; platforma uygun davran.
- **Fluent + Carbon:** tutarlı token sistemi (renk/tip/spacing/motion), veri-yoğun ekranlarda Carbon tablo/ızgara disiplini.

## 2. Frontend Mimari
- **SPA + App Shell:** kabuk (nav/iskelet) anında, içerik sonradan. İlk boya hızlı.
- **PRPL / lazy-load:** rota/ağır bileşen bazlı **code-split** (harita, grafik gibi ağır kütüphaneler lazy). Kritik yolu küçült.
- **CSR/SSR/SSG/ISR:** dashboard = CSR+App Shell; statik/pazarlama içerik olursa SSG/ISR; gerektiğinde Island.
- **Micro-frontends / Jamstack:** yalnız gerçek ölçek gerektirdiğinde; aksi halde monorepo paket sınırlarıyla yetin.

## 3. CSS / Stil Mimari
- **Utility-first** (tailwind/nativewind) varsayılan.
- **ITCSS katmanlama** (global CSS'te): settings → tools → generic → elements → objects → components → utilities. Özgül seçici en sona.
- **CUBE:** Composition + Utility + Block + Exception; token'lar tek kaynak.
- **BEM:** utility dışı özel sınıflarda `block__element--modifier`.
- **OOCSS:** yapı/skin ayrımı, yeniden kullanım.

## 4. Erişilebilirlik (zorunlu)
- **WCAG 2.2 AA:** metin kontrastı ≥ 4.5:1 (büyük metin ≥ 3:1); odak (focus) görünür; dokunma hedefi ≥ 24px (mobil tercih 44px).
- **WAI-ARIA:** doğru rol/aria-label; interaktif öğeler klavye ile erişilebilir.
- **Semantic HTML5:** `button/nav/main/header/section/...`; div-buton yok. RN'de `accessibilityRole/Label`.
- **`prefers-reduced-motion`:** animasyonları azalt/iptal et.

## 5. State Yönetimi
- **Tek yönlü akış (Flux/Redux ilkesi):** veri yukarıdan aşağı; mutasyon ayrık. Sunucu durumu için **react-query**, istemci durumu için **zustand**.
- **FSM (Finite State Machine):** çok adımlı akışlar (sihirbaz, ödeme) açık durumlarla modellenir.
- **Signals / Atomic state:** mevcutsa ince taneli reaktivite.

## 6. Performans
- **Core Web Vitals bütçesi:** LCP < 2.5s, INP < 200ms, CLS < 0.1.
- **RAIL:** yanıt < 100ms, animasyon 60fps (jank yok), idle'da iş, hızlı load.
- Font **self-host** (Google Fonts uzaktan değil); görsel/kod bölme; gereksiz re-render önle (memo/keys).

## 7. Kurumsal/Çözüm Mimarisi (TOGAF) — TAM uygula (zorunlu)
TOGAF bu projenin **yöneten mimari çerçevesidir** (kanonik doküman `docs/EA-TOGAF-mimari.md`, ADM Preliminary→H + Requirements Management). **Her kodlama işinde tam disiplin uygulanır — "küçük iş" diye atlanmaz.** İş ne kadar küçük olursa olsun aşağıdaki adımlar işletilir ve footer'da raporlanır:
- **ADM kontrol listesi** (mimariye dokunan her işte zihinsel tara): **Vision → Business → Data → Application → Technology → Migration → Governance**.
- **4 mimari alan** (mevcut yapıya oturt):
  - *Business:* hangi yetenek/akış etkileniyor (ör. "tespit → bildirim").
  - *Data:* hangi varlık + **gizlilik zonu** (PII: profiles/watches.raw_intent/… vs paylaşılan: canonical_topics/detection_events). RLS/erişim sınıfı.
  - *Application:* hexagonal katman — domain port → application → infra adapter → interface/route; sözleşme `@watcher/contracts`.
  - *Technology:* runtime/deploy etkisi (Hono/Render · Vite/Vercel · Expo · Supabase).
- **Building Blocks:** önce **ABB** (soyut yetenek), sonra **SBB** (somut bileşen/var olan modül). Yeniden kullanımı SBB ile kanıtla.
- **Baseline → Target + Gap:** büyük değişimde mevcut durumu, hedefi ve farkı tek paragrafla yaz.
- **Migration Planning:** DB migration adımları + geri-alma; canlıya **yalnız açık kullanıcı izniyle** (CLAUDE.md kuralı).
- **Governance / Change:** mimari açıdan önemli karar → **ADR**; CI kapısı (lint/typecheck/test/build) değişmez kapıdır.
- **Referans (mevcut, kanonik):** projenin tam TOGAF EA dokümanı `docs/EA-TOGAF-mimari.md` (ADM Preliminary→H + Requirements Mgmt) + karar günlüğü `docs/mimari-karar-gunlugu.md`. Yeni işte: ilgili Phase bölümünü oku, **P1–P9 conformance checklist'ini (§8.2) uygula**, değişikliği §9.2'ye göre sınıfla (Basitleştirme/Artımlı/Yeniden-mimari), gerekiyorsa ADR ekle ve EA dokümanını güncelle (canlı doküman).
- **İşletilecek zorunlu sıra (her işte):**
  1. **ADM taraması:** ilgili Phase(ler)i `docs/EA-TOGAF-mimari.md`'den oku (Vision→Business→Data→Application→Technology→Migration→Governance).
  2. **P1–P9 conformance checklist (§8.2):** dokuz prensibin **hepsini** tek tek cevapla (PII-sınırı, dedup, buy>build, contracts, güvenlik, mobil/offline, tersine-çevrilebilirlik, 25010, sağ-boyut).
  3. **Değişiklik sınıfı (§9.2):** Basitleştirme / Artımlı / Yeniden-mimari olarak etiketle.
  4. **ADR:** Artımlı ve Yeniden-mimari değişikliklerde `docs/mimari-karar-gunlugu.md`'ye Nygard-formatında ADR ekle (alternatifler + kaçış kapısı dahil); önemli kararı değiştiriyorsa "supersedes".
  5. **EA dokümanını güncelle (canlı):** dokunulan Phase bölümü + Phase H "Uygulanan Değişiklik Kaydı"na satır ekle.
  6. **ISO çapraz-kontrol:** 25010 ilgili kalite karakteristiği + 27002 ilgili güvenlik kontrolü (§10) ele alındı mı.
- **Salt görsel/kopya işi bile** en az P1–P9 taraması + değişiklik sınıfı (genelde "Basitleştirme") ile kayda geçer — atlanmaz, "mimari etki yok" diye yazılır ama checklist yine işletilir.

## 8. ISO/IEC Standartları — TAM uygula (zorunlu)
ISO, TOGAF ile birlikte **yöneten kalite/güvenlik/mimari disiplinidir** (EA dokümanı Requirements Management merkezi + Phase G). **Her kodlama işinde aşağıdaki standartlar tek tek işletilir ve footer'da raporlanır.** Sürümler EA dokümanıyla birebir:

- **ISO/IEC/IEEE 42010:2022 — Architecture Description.** Mimariye dokunan işte tanım yapısı: **stakeholder → concern → viewpoint → view**. Yeni view/diyagram bu ayrımı korur (EA Phase A–D §2.3 matrisi kanonik).
- **ISO/IEC 25010:2023 — Ürün Kalite Modeli (9 karakteristik).** Her iş **en az bir** karakteristiğe bağlanır + **ölçülebilir NFR** + doğrulama yöntemi yazılır. Karakteristikler: Functional Suitability · Performance Efficiency · Compatibility · **Interaction Capability** (UI işlerinde zorunlu) · **Reliability** (teslim/akış işlerinde kritik) · **Security** (kritik) · Maintainability · Flexibility · Safety. Kritik eksen: Reliability + Security + Functional Suitability. (EA §10.1 tablosu kanonik.)
- **ISO/IEC 25012:2008 — Veri Kalite Modeli.** Veri/şema/`EventFacts`/feed işlerinde: doğruluk · tamlık · tutarlılık · güncellik · erişilebilirlik · gizlilik (PII zonuyla hizalı). Yeni veri alanı bu boyutlarda değerlendirilir.
- **ISO/IEC 27001:2022 (ISMS) + 27002:2022 (kontroller, 4 tema: Org/People/Physical/Tech).** Güvenliğe dokunan işte ilgili kontrol(ler) işletilir: bilgi sınıflandırma (PII zon) · erişim kontrol (RLS + JWT least-privilege) · kriptografi (TLS + at-rest + secure-store) · güvenli geliştirme (CI kapı + secret-scan) · **veri minimizasyonu/maskeleme = PII-sınırı (P1)** · loglama/izleme · güvenli yapılandırma (env Zod fail-fast). **Sertifika ertelenir, kontrol-adopsiyonu zorunlu.** (EA §10.2 kanonik.)
- **ISO/IEC/IEEE 29148:2018 — Gereksinim Mühendisliği.** Yeni gereksinim/özellik: tek/doğrulanabilir/izlenebilir ifade; Prensip→Gereksinim→Faz→Test izlenebilirliği (EA §10.3) güncellenir.
- **ISO 9241-110/-210 — İnsan-Merkezli Etkileşim.** UI işlerinde WCAG'ı tamamlar: etkileşim ilkeleri (uygunluk, öz-betimleyicilik, hata-toleransı, kullanıcı-kontrolü) + insan-merkezli tasarım döngüsü.
- **İşletilecek zorunlu sıra (her işte):** ① 25010'dan ilgili karakteristik(ler) + ölçülebilir NFR yaz ② veri dokunuşu varsa 25012 boyutları ③ güvenlik dokunuşu varsa 27002 kontrol(leri) ④ UI ise 9241 + WCAG ⑤ gereksinim değiştiyse 29148 izlenebilirlik ⑥ EA §10 Requirements Management'ı güncelle. **Atlanmaz**; ilgisizse "bu işte uygulanmaz" gerekçesi yazılır.

## 9. Material Design — Gezinme & Bileşen Kalıpları (Google kalitesi)
Arayüz "Google kalitesi" hedefler: M3 (Material 3) gezinme + bileşen + durum-katmanı (state layer) + hareket disiplini.

**Gezinme (içeriğe/ekrana göre seç):**
- **Bottom Navigation** (mobil, 3–5 ana hedef): alt çubuk; aktif öğe **pill (secondary-container) gösterge** + ikon dolu/boş; `accessibilityRole="tab"` + seçili durum.
- **Navigation Rail** (web/tablet, geniş ekran): solda dikey, ikon + kısa etiket; **aktif gösterge** (pill arka plan); `<nav aria-label>` + `aria-current="page"`.
- **Navigation Drawer** (çok sayıda hedef): kenardan kayan; modal (mobil) / kalıcı (geniş). Hamburger ile tetik.
- **Tab'lar** (eş-düzey içerik): üst sekmeler; seçili alt-çizgi/gösterge.

**Geçici menüler (eylem/seçim):**
- **Dropdown / Exposed menu**: alan/buton altında liste (filtre, dil, seçim).
- **Overflow (⋮) menü**: araç çubuğuna sığmayan ikincil eylemler (Paylaş/Sil/Çıkış).
- **Context menü**: uzun-bas / sağ-tık; yalnız o öğeye özgü eylemler.
- **Cascading (kademeli)**: masaüstü; üstüne gelince yana açılan alt menü.
- **Menü erişilebilirliği (ZORUNLU):** tetikleyici `aria-haspopup="menu"` + `aria-expanded`; menü `role="menu"`, öğeler `role="menuitem"`; **klavye** (↑↓ gezin, Enter seç, **Esc kapat**), dışarı tıkla-kapat, açılışta ilk öğeye/menüye **odak**, kapanışta tetikleyiciye odak iadesi.

**Butonlar (Material hiyerarşisi — `tone`/`variant`):**
- **Filled/Contained** = birincil (Kaydet/Gönder). **Tonal** = vurgulu ama ikincil.
- **Outlined** = ikincil (İptal/Alternatif). **Text** = düşük öncelik (Diyalog onayı/Daha fazla).
- **FAB** = ekranın ana eylemi (Yeni …), bağımsız yüzen; tek ve net.
- Her buton: **state layer** (hover/focus/pressed yarı-saydam katman) · ≥44–48px hedef · `type="button"` · görünür odak.

**Durum katmanı & hareket (M3 imzası):** etkileşimli her yüzeyde hover/focus/pressed overlay; M3 **emphasized easing** (`cubic-bezier(0.2,0,0,1)`), kısa süre; `prefers-reduced-motion` saygısı; elevation = gölge + tonal yüzey.

## 10. Katman Sözleşmesi: Button → Router → Endpoint
Tetikleyici-yönlendirme-iş mantığı zinciri net ayrılır:
- **Button (UI tetik):** `onClick/onPress` → fonksiyon / yönlendirme / HTTP isteği. Tek sorumluluk; iş mantığı içermez.
- **Router:** *İstemci* (React Router / Expo Router) ekran geçişi (SPA, sayfa yenilemeden); *Sunucu* (Hono) path → controller, auth + sürümleme (`/v1/...`).
- **Endpoint:** `METHOD /v1/path` → zod doğrulama → use-case (application) → domain + infra → contracts-tipli JSON + doğru HTTP kodu (200/201/4xx/5xx). PII dış hatta gitmez (P1).
- Akış: Buton → (UI ise) istemci-router / (veri ise) HTTP → sunucu-router (auth) → endpoint (use-case) → yanıt → UI güncelle (react-query cache).

---

## Çıktı kuralı — "Standartlar" dipnotu
Her kodlama işinin sonunda şu formatta bir blok ekle (yalnız fiilen uygulananları yaz):

> **Standartlar:** Atomic Design · 8pt grid · HIG · ITCSS+CUBE · WCAG 2.2 AA · react-query/zustand tek-yönlü · RAIL/CWV (lazy-load)
> **TOGAF (zorunlu rapor):** Phase(ler): C(Data+Application) · değişiklik sınıfı: Artımlı · P1–P9: tümü ✓ (P1 PII-sınırı: dış egress yok) · ADR-0XX eklendi · EA §9.x kaydı güncellendi.
> **ISO (zorunlu rapor):** 42010 (view yapısı korundu) · **25010**: <karakteristik> + ölçülebilir NFR + doğrulama · 25012: <veri boyutu | uygulanmaz> · **27002**: <kontrol | uygulanmaz> · 29148: <izlenebilirlik | uygulanmaz> · 9241/WCAG: <UI | uygulanmaz>.

Uygulanmayan ama ilgili bir standardı bilinçli atladıysan tek satırla nedenini belirt. **TOGAF ve ISO asla atlanmaz** — mimari/kalite etkisi yoksa bile P1–P9 taraması + 25010 karakteristiği + "Basitleştirme" sınıfı yazılır.

## Metin Taşma Standardı (ADR-064) — ZORUNLU
Her metin öğesi için taşma davranışı AÇIKÇA tanımlanmalı; "doğal akışa" bırakılmaz.

| Öğe türü | Kural |
|---|---|
| **Başlık (kart/hero)** | `numberOfLines={2}` (hero başlığı `={1}`); kapsayıcı `flex-1` + `min-w-0`. |
| **Meta/etiket/değer (tek satır)** | `numberOfLines={1}`; esneyen tarafta `flex-1` + `ellipsizeMode="tail"`. |
| **Kısa sabit etiket** (frekans, sayaç, "research") | `numberOfLines={1}` + `shrink-0` — asla kırılmaz, asla kırpılmaz. |
| **Domain/URL/e-posta** | `flex-1 min-w-0` + `numberOfLines={1}` + `ellipsizeMode="tail"` (or "middle" URL'de). |
| **Rozet (Badge)** | İçerik kırpılmaz; satıra sığmazsa kapsayıcı `flex-wrap` ile alt satıra sarar. |
| **Sayı (istatistik)** | `numberOfLines={1}`. |

İlkeler: (1) yan-yana esnek+sabit öğelerde sabit olana `shrink-0`, esneyene `flex-1 min-w-0`. (2) `flex` satırında uzun metin için ebeveyne `min-w-0` şart (yoksa RN/web kırpmaz, taşırır). (3) çok dilli (11 dil) — TR/DE/RU daha uzun; her etiket en uzun dile göre taşma-güvenli olmalı.
