/**
 * Canlı kaynak okuma (ADR-047/048): tarama ANINDA resmî sitenin kendisinden
 * içerik çeker — arama motoru indeks gecikmesini sıfırlar ("o an en son neyse").
 *
 * 30-ajan eleştirisi (ADR-048) sonrası sağlamlaştırma:
 *  - Çöp filtresi: çerez/gizlilik-bandı ağırlıklı veya bilgisiz metin REDDEDİLİR
 *    (modele değersiz içerik sokulmaz — SPA ana sayfası tipik tuzağı).
 *  - Çok-yol: ana sayfa + yaygın duyuru yolları paralel denenir; en bilgilendirici
 *    olan seçilir (asıl duyuru çoğu zaman alt sayfada).
 *  - Güvenlik: yalnız https + kamusal alan adı (SSRF guard), 5 sn timeout/yol.
 */

const MAX_CHARS = 1800;
const TIMEOUT_MS = 5000;
const MIN_USEFUL_CHARS = 80;
/** Yaygın duyuru/haber yolları (TR + EN) — asıl içerik genelde burada. */
const PATHS = ["/", "/duyurular", "/haberler", "/announcements", "/news"];
/** Çerez/gizlilik bandı imzaları — metin bunlardan ibaretse değersizdir. */
const NOISE = /çerez|cookie|gizlilik politikas|kvkk|aydınlatma metni|privacy policy/gi;

/**
 * Render-proxy URL'i kurar (ADR-070): JS-render gerektiren dinamik sayfalar için.
 * template örn: "https://app.scrapingbee.com/api/v1/?api_key=KEY&render_js=true&url={url}"
 * {url} gerçek hedefle (encode edilerek) doldurulur. template yoksa hedef URL aynen
 * döner → düz fetch (geriye uyum). Sağlayıcı-bağımsız: ScrapingBee/ScraperAPI/Browserless.
 */
export function buildFetchUrl(targetUrl: string, renderTemplate?: string | null): string {
  if (!renderTemplate || !renderTemplate.includes("{url}")) return targetUrl;
  return renderTemplate.replace("{url}", encodeURIComponent(targetUrl));
}

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

/**
 * İçerik bilgilendirici mi? Çöp (çerez bandı / boş SPA iskeleti) reddedilir.
 * Skor: uzunluk + gürültü-dışı oran. Düşükse null sayılır.
 */
export function isInformative(text: string): boolean {
  if (text.length < MIN_USEFUL_CHARS) return false;
  const noiseChars = (text.match(NOISE) ?? []).join("").length;
  // Metnin yarısından fazlası çerez/gizlilik imzasıysa değersiz.
  if (noiseChars > 0 && text.replace(NOISE, "").trim().length < MIN_USEFUL_CHARS) return false;
  return true;
}

async function fetchPath(
  domain: string,
  path: string,
  fetchImpl: typeof fetch,
  renderTemplate?: string | null,
): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    // Render-proxy daha yavaştır (gerçek tarayıcı) → JS-render'da timeout 2x.
    const timer = setTimeout(() => ctrl.abort(), renderTemplate ? TIMEOUT_MS * 2 : TIMEOUT_MS);
    const url = buildFetchUrl(`https://${domain}${path}`, renderTemplate);
    const res = await fetchImpl(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "WhenlyBot/1.0 (+monitoring)" },
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const text = htmlToText(await res.text());
    return isInformative(text) ? text : null;
  } catch {
    return null;
  }
}

/**
 * Resmî siteden ŞU AN içerik çeker: ana sayfa + duyuru yolları paralel; en uzun
 * bilgilendirici metni döner. Hiçbiri işe yaramazsa null (genel akış sürer).
 * renderTemplate verilirse JS-render proxy üzerinden çeker (dinamik sayfalar).
 */
export async function fetchOriginText(
  domain: string,
  fetchImpl: typeof fetch = fetch,
  renderTemplate?: string | null,
): Promise<string | null> {
  if (!isFetchableDomain(domain)) return null;
  const results = await Promise.all(
    PATHS.map((p) => fetchPath(domain, p, fetchImpl, renderTemplate)),
  );
  const useful = results.filter((t): t is string => t !== null);
  if (useful.length === 0) return null;
  // En bilgilendirici = en uzun gürültü-dışı metin.
  return useful.reduce((best, t) =>
    t.replace(NOISE, "").length > best.replace(NOISE, "").length ? t : best,
  );
}
