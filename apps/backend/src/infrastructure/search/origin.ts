/**
 * Canlı kaynak okuma (ADR-047): tarama ANINDA resmî sitenin kendisinden içerik
 * çeker — arama motoru indeks gecikmesini sıfırlar ("o an en son neyse").
 * Güvenlik: yalnız https + gerçek alan adı (IP/localhost/iç ağ reddedilir),
 * 5 sn zaman aşımı, içerik 1500 karaktere kırpılır.
 */

const MAX_CHARS = 1500;
const TIMEOUT_MS = 5000;

/** SSRF koruması: yalnız kamusal görünümlü alan adları. */
export function isFetchableDomain(domain: string): boolean {
  const d = domain.toLowerCase().trim();
  if (!/^[a-z0-9.-]+$/.test(d)) return false;
  if (!d.includes(".")) return false; // tek etiket (localhost vb.)
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(d)) return false; // IP literal
  if (/(^|\.)(localhost|local|internal|lan|home|corp)$/.test(d)) return false;
  return true;
}

/** HTML'i kaba metne indirger (script/style söküm + etiket temizliği). */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_CHARS);
}

/** Resmî sitenin ana sayfasını ŞU AN çeker; hata/uygunsuzlukta null (sessiz). */
export async function fetchOriginText(
  domain: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  if (!isFetchableDomain(domain)) return null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetchImpl(`https://${domain}/`, {
      signal: ctrl.signal,
      headers: { "User-Agent": "WhenlyBot/1.0 (+monitoring)" },
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const text = htmlToText(await res.text());
    return text.length >= 40 ? text : null; // anlamlı içerik yoksa atla
  } catch {
    return null;
  }
}
