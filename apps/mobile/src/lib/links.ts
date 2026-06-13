/**
 * Ürün-dışı bağlantılar — tek kaynak. Tanıtım sitesi global-first (EN kök, TR /tr).
 * Özel alan adına geçişte yalnız EXPO_PUBLIC_SITE_URL değişir (ADR-098).
 */
export const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL ?? "https://whenly-site.vercel.app";

/** Kullanıcının arayüz diline uygun site adresi (yalnız tr için /tr alt yolu var). */
export function siteUrlFor(lang: string): string {
  return lang.startsWith("tr") ? `${SITE_URL}/tr/` : `${SITE_URL}/`;
}
