import type { GoldenCase } from "../src/domain/eval";

/**
 * Golden-set (ADR-075/A4) — tespit kalitesi ölçüm vakaları. Çeşitli (TR + global,
 * bireysel + kurumsal), olumlu + olumsuz + tekrar senaryoları. Canlı çalışınca
 * gerçek web'e bakar; judge deterministiktir. Büyüdükçe 👎 alan gerçek vakalar eklenir.
 */
export const GOLDEN_SET: GoldenCase[] = [
  // --- Olumlu: kamusal, web'de yayınlanan, tespit BEKLENEN ---
  {
    id: "earthquake-major",
    query: "Japonya'da 7 üzeri büyüklükte deprem",
    expect: { detected: true, confidenceAtLeast: 0.5 },
  },
  {
    id: "exam-result-public",
    query: "üniversite giriş sınavı sonuçları açıklandı mı",
    expect: { detected: true },
  },
  {
    id: "official-gazette-reg",
    query: "resmî gazetede yeni veri koruma yönetmeliği yayınlandı mı",
    expect: { detected: true },
  },
  // --- Olumsuz: henüz olmamış / gelecekteki olay → tespit BEKLENMİYOR ---
  {
    id: "future-event-none",
    query: "2099 yılı kış olimpiyatları açılış töreni yapıldı mı",
    expect: { detected: false, confidenceAtMost: 0.5 },
  },
  {
    id: "vague-no-event",
    query: "hava durumu güzel mi",
    expect: { detected: false },
  },
  // --- Tekrar bastırma: aynı olay daha önce bildirildi → YENİ değil ---
  {
    id: "repeat-suppression",
    query: "ülke çapında sınav giriş belgeleri açıklandı mı",
    lastEventDescription: "Sınav giriş belgeleri açıklandı.",
    expect: { detected: false },
  },
  // --- Eşik/fiyat: net olmayan, belirsiz band (eskalasyon adayı) ---
  {
    id: "ambiguous-price",
    query: "popüler bir telefon modelinin fiyatı bugün düştü mü",
    expect: { detected: false }, // somut model/eşik yok → güvenli varsayım: hayır
  },
  // --- Kurumsal: kamusal ihale/duyuru ---
  {
    id: "public-tender",
    query: "kamu elektronik ihale platformunda bugün yeni ihale yayınlandı mı",
    expect: { detected: true },
  },
];
