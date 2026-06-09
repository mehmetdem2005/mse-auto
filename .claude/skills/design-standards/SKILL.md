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

---

## Çıktı kuralı — "Standartlar" dipnotu
Her kodlama işinin sonunda şu formatta bir blok ekle (yalnız fiilen uygulananları yaz):

> **Standartlar:** Atomic Design · 8pt grid · HIG · ITCSS+CUBE · WCAG 2.2 AA · react-query/zustand tek-yönlü · RAIL/CWV (lazy-load) …

Uygulanmayan ama ilgili bir standardı bilinçli atladıysan tek satırla nedenini belirt.
