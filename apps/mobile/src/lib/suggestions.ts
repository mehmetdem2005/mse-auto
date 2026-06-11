// Hazır izleme önerileri (ADR-069/071) — saha araştırmasından (docs/gercek-talepler.md)
// çıkan en yüksek değerli GERÇEK talep KALIPLARI. Hardcode YOK: somut şehir/marka/
// kurum gömülmez; metinler 11 dilde i18n kataloğunda (suggest.*). Kod yalnız anahtar
// listesi tutar → evrensel (her ülke/dil) + bakımı tek noktadan.

export type SuggestionScope = "personal" | "business";

/** Öneri anahtarları; metin/etiket i18n'de `suggest.<key>.label|sentence`. */
export const SUGGESTION_KEYS: Record<SuggestionScope, string[]> = {
  personal: [
    "appointment", // randevu açılması (vize/konsolosluk/resmî)
    "doctor", // sağlık randevusu
    "medicine", // ilaç/ürün stok (eczane)
    "rental", // yeni kiralık/satılık ilan
    "restock", // ürün stoğa girince
    "tickets", // etkinlik/bilet satışa çıkınca
    "priceDrop", // fiyat hedefin altına inince
    "result", // sınav/başvuru sonucu açıklanınca
  ],
  business: [
    "tender", // ihale/teklif çağrısı yayınlanınca
    "regulation", // mevzuat/yönetmelik değişince
    "grant", // hibe/destek/fon çağrısı açılınca
    "competitor", // rakip fiyat/sayfa değişimi
    "brand", // marka/itibar olumsuz anılma
    "expiry", // alan adı / sertifika / abonelik süresi
  ],
};
