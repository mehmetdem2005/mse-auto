import type { WatchArchetype } from "./watch";

export interface Canonicalized {
  /** PII'siz, normalize edilmiş dedup anahtarı (P1/P2). */
  canonicalQuery: string;
  archetype: WatchArchetype;
}

/** İlk-şahıs/kişisel işaretçiler (TR + EN) → arketip "personal" (ADR-010). */
const PERSONAL_MARKERS = [
  "benim",
  "bana",
  "kendi",
  "hesabım",
  "hesabim",
  "numaram",
  "biletim",
  "siparişim",
  "siparisim",
  "başvurum",
  "basvurum",
  "sonucum",
  "my ",
  "mine",
  "my account",
  "my order",
  "my ticket",
  "my application",
  "my result",
];

/**
 * Ham doğal-dil niyetini kanonik (PII'siz) sorguya çevirir + arketipi sınıflar.
 * NOT: Bu yapısal/heuristik bir ilk sürümdür; Faz 6'da DeepSeek tabanlı
 * semantik kanonikleştirme bunu değiştirir/zenginleştirir. Mimari akış (kanonikleştir →
 * dedup → link) ve PII-sıyırma burada kanıtlanır.
 */
/** Yıl (1900–2099) kamusal bilgidir; PII-kimlik sayılmaz (ADR-042). */
function isYear(s: string): boolean {
  const n = Number(s);
  return s.length === 4 && n >= 1900 && n <= 2099;
}

/** Kimlik kokan sayı: ≥5 hane, ya da yıl olmayan 4 hane (bilet/sipariş no vb.). */
function hasPiiNumber(s: string): boolean {
  if (/\d{5,}/.test(s)) return true;
  return (s.match(/\d{4}/g) ?? []).some((m) => !isYear(m));
}

/** Kişisel sorgudan kimlik sayılarını sıyır; yılları koru. */
function stripPiiNumbers(s: string): string {
  return s
    .replace(/\d{5,}/g, "")
    .replace(/\d{4}/g, (m) => (isYear(m) ? m : ""))
    .replace(/\s+/g, " ")
    .trim();
}

export function canonicalize(rawIntent: string): Canonicalized {
  const lowered = rawIntent.toLowerCase().trim().replace(/\s+/g, " ");
  const hasPersonalMarker = PERSONAL_MARKERS.some((m) => lowered.includes(m));
  const archetype: WatchArchetype =
    hasPersonalMarker || hasPiiNumber(lowered) ? "personal" : "shared";

  // ADR-042: Konu paylaşımı yalnız BİREBİR aynı metinde (harf/boşluk normalizasyonu
  // dışında KAYIPSIZ) olur — eski kayıplı sayı sıyırma farklı eşik/yıl içeren
  // niyetleri aynı konuya yapıştırıyordu. Kişisel arketipte kimlik sayıları (PII)
  // yine sıyrılır (P1: bu sorgu dış aramaya gider); yıllar korunur.
  const canonicalQuery = archetype === "personal" ? stripPiiNumbers(lowered) : lowered;

  return { canonicalQuery, archetype };
}
