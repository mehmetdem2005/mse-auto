---
name: ui-ux-advanced
description: Gelişmiş UX kalıpları — progressive disclosure, mikro-etkileşimler, boş/yükleme/hata durumları, algılanan performans, güven. Her UI işinde design-standards ile BİRLİKTE uygulanır.
---

# Gelişmiş UI/UX Kalıpları

Kaynaklar: UXPin & IxDF progressive-disclosure (2026) · Taboola mobile-UX-best-practices · sanjaydey mobile-patterns-2026 · droidsonroids mobile-UI-guide.

## 1. Progressive disclosure (aşamalı ifşa)
- Birincil yüzeyde yalnız **bir sonraki adım için gereken** bilgi; detay isteyene açılır (akordeon/sheet/detay sayfası).
- Varsayılanlar akıllı olsun: kullanıcı hiçbir şey seçmeden ilerleyebilmeli; gelişmiş seçenekler "katlanmış" başlasın.
- Liste → detay → ham veri üç katmandır; katman atlatma (listede ham veri dökme) kalabalığın 1 numaralı sebebidir.

## 2. Mikro-etkileşimler (her etkileşimde geri bildirim)
- Her dokunuşun **anında görsel karşılığı** olmalı: bası-ölçeği (scale 0.97), ripple/opacity, durum değişiminde geçiş.
- Durum değişimleri ANİ olmamalı: görünen/kaybolan öğe fade/slide ile; sayı değişimi sayarak; toggle kayarak.
- Geri bildirimsiz buton = bozuk buton say.

## 3. Durum tasarımı: dört durum kuralı
Her veri yüzeyi 4 durumu TASARLANMIŞ olmalı (kendiliğinden olmaz):
1. **Yükleme**: skeleton (spinner değil) — içerik yerleşimini taklit eder, CLS önler.
2. **Boş**: yönlendirici boş durum — ne olduğunu söyle + tek eylem öner ("İlk watcher'ını oluştur").
3. **Hata**: insanca mesaj + kurtarma eylemi (yeniden dene / elle devam). Çıplak hata kodu yasak.
4. **Dolu**: hiyerarşili içerik (bkz. web-design-advanced).

## 4. Algılanan performans
- İlk anlamlı içerik <1 sn hissi: skeleton + optimistik güncelleme (react-query onMutate) + anında navigasyon.
- Uzun işlemde ilerleme göster; 3 sn'den uzun belirsiz bekleme yasak.

## 5. Güven ve şeffaflık
- Sistem ne yaptığını gösterir: "izleniyor", "son kontrol 12:00", kanıt zinciri (ne arandı → ne bulundu → neden karar verildi).
- Yıkıcı eylem: onay + geri-alma yolu; sessiz veri silme yasak.
- Kullanıcı dili: teknik jargon yerine kullanıcının kelimeleri ("topic" değil "konu").

## 6. Dokunma ve erişim
- Hedef ≥44pt; birincil eylem başparmak bölgesinde (alt yarı).
- Tek elle kullanım: kritik akışlar alt-navigasyon + FAB ile tamamlanabilmeli.
