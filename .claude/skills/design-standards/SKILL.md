---
name: design-standards
description: Tüm kodlama/UI işlerinde uygulanacak tasarım, frontend mimari, CSS, erişilebilirlik, state ve performans standartları. Watcher (mobil + dashboard + backend) dahil her arayüz/kod görevinde kullanılır. Çıktının sonunda uygulanan standartlar listelenir.
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

---

## Çıktı kuralı — "Standartlar" dipnotu
Her kodlama işinin sonunda şu formatta bir blok ekle (yalnız fiilen uygulananları yaz):

> **Standartlar:** Atomic Design · 8pt grid · HIG · ITCSS+CUBE · WCAG 2.2 AA · react-query/zustand tek-yönlü · RAIL/CWV (lazy-load)
> **TOGAF (zorunlu rapor):** Phase(ler): C(Data+Application) · değişiklik sınıfı: Artımlı · P1–P9: tümü ✓ (P1 PII-sınırı: dış egress yok) · ADR-0XX eklendi · EA §9.x kaydı güncellendi · ISO 25010: <karakteristik> / 27002: <kontrol>.

Uygulanmayan ama ilgili bir standardı bilinçli atladıysan tek satırla nedenini belirt. **TOGAF asla atlanmaz** — mimari etki yoksa bile P1–P9 taraması + "Basitleştirme" sınıfı yazılır.
