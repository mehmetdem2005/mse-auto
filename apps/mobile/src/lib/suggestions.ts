// Hazır izleme önerileri (ADR-069) — saha araştırmasından (docs/gercek-talepler.md)
// çıkan en yüksek değerli GERÇEK talepler. Kullanıcı boş ekranla değil, gerçek
// değer örnekleriyle başlar; öneriye dokununca cümle sihirbaz sohbetine yazılır.
// İçerik olduğundan TR + EN iki set; diğer dillerde EN'e düşülür.

export type SuggestionScope = "personal" | "business";

export interface Suggestion {
  /** Çipte görünen kısa etiket. */
  label: string;
  /** Sohbete gönderilecek tam watcher cümlesi. */
  sentence: string;
}

export interface SuggestionGroup {
  scope: SuggestionScope;
  items: Suggestion[];
}

const TR: SuggestionGroup[] = [
  {
    scope: "personal",
    items: [
      {
        label: "Vize randevusu",
        sentence: "İtalya Schengen vize randevusu İstanbul'da açılınca anında haber ver",
      },
      {
        label: "Doktor randevusu",
        sentence: "Kadıköy'de kardiyoloji MHRS randevusu açılınca anında haber ver",
      },
      {
        label: "İlaç stoğu",
        sentence: "Aradığım ilaç İstanbul Anadolu yakası eczanelerinde stoğa girince haber ver",
      },
      {
        label: "Kiralık ilan",
        sentence: "Kadıköy'de 2+1, 30.000 TL altı yeni kiralık ilan çıkınca anında haber ver",
      },
      {
        label: "Ürün stoğu",
        sentence: "PlayStation 5 resmi satıcıda stoğa girince anında haber ver",
      },
      {
        label: "Konser bileti",
        sentence: "Tarkan Ankara konseri bileti satışa açılınca 5 dakika önce hatırlat",
      },
      { label: "Fiyat düşüşü", sentence: "iPhone 16 fiyatı 40.000 TL altına inince haber ver" },
      {
        label: "Sınav sonucu",
        sentence: "ÖSYM ek yerleştirme boş kontenjan listesi yayınlanınca haber ver",
      },
    ],
  },
  {
    scope: "business",
    items: [
      {
        label: "İhale ilanı",
        sentence: "EKAP'ta İstanbul inşaat malzemesi ihalesi yayınlanınca haber ver",
      },
      {
        label: "Mevzuat değişikliği",
        sentence: "Resmî Gazete'de sektörümle ilgili yönetmelik değişince haber ver",
      },
      { label: "Hibe / destek", sentence: "KOSGEB Ar-Ge destek çağrısı açılınca haber ver" },
      { label: "Rakip fiyatı", sentence: "Rakibimin fiyat sayfasında değişiklik olunca haber ver" },
      {
        label: "Marka takibi",
        sentence: "Markam sosyal medyada veya şikâyet sitelerinde olumsuz tonla geçince haber ver",
      },
      {
        label: "SSL / domain",
        sentence: "sirketim.com SSL sertifikası 14 gün içinde dolacaksa haber ver",
      },
    ],
  },
];

const EN: SuggestionGroup[] = [
  {
    scope: "personal",
    items: [
      {
        label: "Visa appointment",
        sentence: "Notify me the moment a Schengen visa appointment opens in my city",
      },
      {
        label: "Doctor appointment",
        sentence: "Notify me instantly when a cardiology appointment opens nearby",
      },
      {
        label: "Medicine stock",
        sentence: "Notify me when the medicine I need is back in stock at local pharmacies",
      },
      {
        label: "New rental listing",
        sentence: "Notify me instantly when a new 2-bed rental under $1000 is listed in my area",
      },
      {
        label: "Product restock",
        sentence:
          "Notify me the instant the PlayStation 5 is back in stock at an official retailer",
      },
      {
        label: "Concert tickets",
        sentence: "Remind me 5 minutes before tickets for [artist] go on sale",
      },
      { label: "Price drop", sentence: "Notify me when the iPhone 16 drops below $800" },
      {
        label: "Exam results",
        sentence: "Notify me when the supplementary placement quotas are announced",
      },
    ],
  },
  {
    scope: "business",
    items: [
      {
        label: "Tender notice",
        sentence: "Notify me when a new construction-materials tender is published in my region",
      },
      {
        label: "Regulation change",
        sentence:
          "Notify me when a regulation affecting my industry is published in the official gazette",
      },
      { label: "Grant / funding", sentence: "Notify me when a new R&D grant call opens" },
      {
        label: "Competitor price",
        sentence: "Notify me when my competitor changes the price on their pricing page",
      },
      {
        label: "Brand monitoring",
        sentence: "Notify me when my brand is mentioned negatively on social media or review sites",
      },
      {
        label: "SSL / domain",
        sentence: "Notify me when my domain's SSL certificate is within 14 days of expiry",
      },
    ],
  },
];

/** Aktif dile göre öneri grupları (TR/EN; diğerleri EN). */
export function suggestionsFor(lang: string): SuggestionGroup[] {
  return lang.startsWith("tr") ? TR : EN;
}
