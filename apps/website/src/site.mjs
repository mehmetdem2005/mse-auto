// Site tek-kaynak yapılandırması + paylaşılan yardımcılar.
// GEO mimarisi gereği (docs/GEO-pazarlama-mimarisi.md): tüm sayfalar statik HTML
// üretilir (AI crawler'lar JS çalıştırmaz — Vercel/MERJ ölçümü), kanonik URL ve
// içerik verisi tek kaynaktan gelir (sitemap + llms.txt + JSON-LD aynı veriden).

/** Kanonik site adresi — özel alan adı alınınca SITE_URL env/Variable ile değiştirilir.
 *  `||` bilinçli: CI'da tanımsız Variable BOŞ STRING gelir, o da varsayılana düşmeli. */
export const SITE_URL = (process.env.SITE_URL || "https://whenly-site.vercel.app").replace(
  /\/$/,
  "",
);

/** Canlı web uygulaması (CTA + JSON-LD + llms.txt hedefi) — APP_URL env ile değiştirilebilir. */
export const APP_URL = (process.env.APP_URL || "https://watcher-app-inky.vercel.app").replace(
  /\/$/,
  "",
);

export const CONTACT_EMAIL = "mehmetdem782100@gmail.com";

/** IndexNow anahtarı — herkese açık olması protokol gereği normaldir (sahiplik kanıtı). */
export const INDEXNOW_KEY = "whenly7c3aed6366f1b1220e2026";

export const BRAND = {
  name: "Whenly",
  /** Marka gradyanı — apps/mobile/src/theme GRADIENT.brand ile birebir. */
  gradFrom: "#6366F1",
  gradTo: "#7C3AED",
  ink: "#0B1220",
};

/** @param {string} s */
export function esc(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** JSON-LD bloğu — </script> enjeksiyonuna karşı kaçışlı. @param {unknown} data */
export function jsonLd(data) {
  const json = JSON.stringify(data).replaceAll("</", "\\u003c/");
  return `<script type="application/ld+json">${json}</script>`;
}

/**
 * Lucide-stili inline vektör ikonlar (24×24 grid, stroke 2, yuvarlak uç) —
 * EMOJİ YASAĞI gereği tek ikon dili. İkonlar dekoratiftir (aria-hidden);
 * anlam her zaman bitişik görünür metinde taşınır.
 * @type {Record<string, string>}
 */
const ICON_PATHS = {
  bellRing:
    '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><path d="M4 2C2.8 3.7 2 5.7 2 8"/><path d="M22 8c0-2.3-.8-4.3-2-6"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  shieldCheck:
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  pkg: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  ticket:
    '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 11v2"/><path d="M13 17v2"/>',
  trendingDown: '<path d="m22 17-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/>',
  gavel:
    '<path d="m14 13-7.5 7.5a2.12 2.12 0 0 1-3-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/>',
  coins:
    '<circle cx="8" cy="8" r="6"/><path d="M18.1 10.4A6 6 0 1 1 10.3 18"/><path d="M7 6h1v4"/><path d="m16.7 13.9.7.7-2.8 2.8"/>',
  scale:
    '<path d="m16 16 3-8 3 8c-.9.65-1.9 1-3 1s-2.1-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.9.65-1.9 1-3 1s-2.1-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
  refresh:
    '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>',
  messageSquare: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  smartphone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  languages:
    '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
};

/**
 * @param {keyof typeof ICON_PATHS | string} name
 * @param {number} [size]
 * @param {string} [cls]
 */
export function icon(name, size = 24, cls = "") {
  const paths = ICON_PATHS[name];
  if (!paths) throw new Error(`Bilinmeyen ikon: ${name}`);
  const cl = cls ? ` class="${cls}"` : "";
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${cl}>${paths}</svg>`;
}

/** Marka işareti — radar/nabız motifi (izleme metaforu); logo + favicon ile aynı geometri. */
export function brandMark(size = 28) {
  const grad = `<defs><linearGradient id="bm" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="${BRAND.gradFrom}"/><stop offset="1" stop-color="${BRAND.gradTo}"/></linearGradient></defs>`;
  const shapes =
    '<circle cx="16" cy="16" r="13" stroke="url(#bm)" stroke-width="2" opacity=".35"/>' +
    '<path d="M16 7a9 9 0 0 1 9 9" stroke="url(#bm)" stroke-width="2.5" stroke-linecap="round"/>' +
    '<path d="M16 12a4 4 0 0 1 4 4" stroke="url(#bm)" stroke-width="2.5" stroke-linecap="round"/>' +
    '<circle cx="16" cy="16" r="2.4" fill="url(#bm)"/>';
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 32 32" fill="none">${grad}${shapes}</svg>`;
}
