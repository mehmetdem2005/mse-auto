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
export function canonicalize(rawIntent: string): Canonicalized {
  const lowered = rawIntent.toLowerCase().trim();
  const hasPersonalMarker = PERSONAL_MARKERS.some((m) => lowered.includes(m));
  const hasLongNumber = /\d{4,}/.test(lowered);
  const archetype: WatchArchetype = hasPersonalMarker || hasLongNumber ? "personal" : "shared";

  // Kanonik sorgu: uzun sayısal tanımlayıcıları (bilet/sipariş no vb.) sıyır + normalize (PII, P1).
  const canonicalQuery = lowered
    .replace(/\d{4,}/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return { canonicalQuery, archetype };
}
