---
name: motion-design
description: Gelişmiş animasyon/motion — react-native-reanimated 3 kalıpları, süre/easing token'ları, stagger, reduce-motion zorunluluğu. Her UI işinde uygulanır; "animasyon yok" kabul edilmez.
---

# Motion Design (Reanimated 3)

Kaynaklar: Reanimated resmi docs (entering/exiting, layout transitions, withSpring) · reactnative.university layout-animations · dev.to smooth-UX-reanimated-3 (2026).

## 1. Ne animasyonlanır (beyaz liste)
- YALNIZ `opacity` ve `transform` (translate/scale) — layout/renk animasyonu pahalıdır, kaçın.
- Görünen her yeni öğe **girişle** gelir (FadeInUp/FadeInDown), kaybolan **çıkışla** gider; "pat diye" görünme yasak.

## 2. Süre/easing token'ları
- mikro (bası, toggle): **120-150 ms** · standart (giriş, açılır): **200-250 ms** · büyük (ekran/sheet): **300-350 ms**.
- Spring varsayılanı: `damping 18 · stiffness 180` (zıplamasız, tok); dikkat çekme animasyonunda hafif overshoot serbest.

## 3. Reanimated 3 kuralları (resmi docs)
- Önce **hazır preset'ler**: `FadeInUp`, `FadeIn`, `SlideInDown`, `Layout.springify()`; custom worklet en son çare.
- Builder'ları **bileşen dışında / useMemo'da** kur (performans).
- Liste girişleri **stagger**: `FadeInUp.delay(index * 40).springify().damping(18)`; uzun listede ilk mount'ta stagger'ı sınırla (ilk ~12 öğe), sonrası animasyonsuz.
- `Layout` transition ile ekleme/silme/yeniden sıralama otomatik yumuşar (elle transform hesaplama).
- JS thread'e iş kaçırma: animasyon worklet'te (UI thread) kalır.

## 4. Standart desenler (bu repoda kullan)
- **AnimatedPressable**: pressIn → `scale withSpring(0.97)`, pressOut → 1; tüm Btn/Card/FAB'da.
- **Liste kartları**: `entering={FadeInUp.delay(i*40).springify().damping(18)}` (i ≤ 12).
- **Akordeon/expanded içerik**: `entering={FadeIn.duration(200)}` + dönen chevron (`withTiming` rotate 90°).
- **Sohbet balonu**: kullanıcı sağdan (`SlideInRight`-vari FadeInUp), asistan soldan; yazıyor göstergesi nabız.
- **Sayaçlar**: count-up (mevcut `useCountUp`).

## 5. Reduce-motion ZORUNLU
- Her animasyon `useReduceMotion()` ile kapatılabilir olmalı: reduce'ta giriş animasyonu `undefined`, spring yerine anında değer.
- Web'de `prefers-reduced-motion` eşleniği korunur.

## 6. Kabul ölçütü
İş bitiminde ekranda şunlar OYNAMALI: liste girişi (stagger) · bası geri bildirimi · açılır içerik geçişi · durum değişimi. Hiçbiri yoksa iş bitmemiştir.
