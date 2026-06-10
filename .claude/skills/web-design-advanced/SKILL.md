---
name: web-design-advanced
description: Gelişmiş görsel web/app tasarımı — görsel hiyerarşi, tipografi ölçeği, boşluk sistemi, ikonografi, "AI-ürünü görünümü"nden kaçınma. Her UI işinde design-standards ile BİRLİKTE uygulanır.
---

# Gelişmiş Web/App Görsel Tasarımı

Kaynaklar: IxDF Visual Hierarchy (2026) · Clay visual-hierarchy guide · techloy web-design-principles-2026 · essential-blocks principles. Bu skill "çalışan ama öğrenci işi" arayüzü "ürün" yapan kuralları zorlar.

## 1. Görsel hiyerarşi (her ekranda sırayla denetle)
- Ekranın **tek bir birincil odağı** olmalı: kullanıcı 3 sn'de "ne bakmalı, ne okumalı, ne yapmalı"yı söyleyebilmeli.
- Hiyerarşi araçları sırasıyla: **boyut > kontrast > konum > boşluk > ağırlık**. Renk en son araçtır, tek başına anlam taşıyamaz (a11y).
- Aynı önemdeki öğeler aynı stilde olmalı; iki farklı stil = iki farklı önem demektir (yanlışsa düzelt).

## 2. Tipografi
- **En çok 2 font ailesi**; ağırlık/boyutla varyasyon yap, yeni font ekleme.
- **Tip ölçeği sabit oranlı**: 1.25 (majör üçlü) — örn. 12 / 15 / 19 / 24 / 30. Ara değer uydurma.
- Satır yüksekliği: gövde ≥1.45×, başlık ≈1.2×. Satır genişliği 45–75 karakter.
- **UPPERCASE+tracking yalnız küçük etiketlerde** (overline/label); başlık ve gövdede asla — her yerde uppercase "AI-ürünü/teknik demo" görünümünün 1 numaralı sebebidir.

## 3. Boşluk ve yüzeyler
- **8pt grid**: tüm spacing 4/8'in katı. Bölüm arası ≥24, kart içi 16, satır içi 8.
- **Proximity**: ilişkili öğeler yakın, ilişkisizler uzak — çizgi/çerçeve yerine önce boşlukla ayır.
- Yüzey hiyerarşisi: zemin → kart → vurgulu kart. Aynı ekranda en çok 3 yüzey tonu; her karta border VERME (ya gölge ya border, ikisi birden ağır).
- Köşe yarıçapı tek ölçek: küçük 8 / orta 12 / büyük 16-24; ekran başına karıştırma.

## 4. İkonografi — EMOJİ YASAĞI
- **Buton/etiket içinde emoji KESİNLİKLE yasak** (👍 ❚❚ ▶ 🔍 🧠 ⟳ vb.) — platformlar arası tutarsız render edilir ve "hazır/AI işi" görünümünün 2 numaralı sebebidir.
- Tek vektör ikon seti kullan (**lucide** önerilir); boyutlar 16/20/24; ikon rengi metin rengiyle aynı token'dan.
- İkon asla tek başına anlam taşımaz: ya yanında görünür metin ya da accessibilityLabel/aria-label.

## 5. "AI-ürünü görünümü" karşı listesi (kod incelemesinde uygula)
- ❌ her yerde uppercase mikro-etiket · ❌ emoji ikon · ❌ her kartta border+aynı gri · ❌ her şey aynı boyutta · ❌ jenerik "Card içinde Card"
- ✅ tek odak + gerçek tip ölçeği · ✅ vektör ikon · ✅ boşlukla ayrım · ✅ kasıtlı asimetri (önemli olan büyük)

## 6. Token disiplini
- Renk/spacing/radius/tip değerleri TEK kaynaktan (tailwind config / tokens). Bileşen içine ham hex/px gömme; inline style yalnız dinamik değerler için.
