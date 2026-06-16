// HTML render katmanı — Atomic yaklaşım: atom (icon/btn/badge) → molekül (kart,
// telefon maketi, SSS öğesi) → organizma (header/footer/bölümler) → sayfa şablonları.
// Erişilebilirlik: semantik HTML5, tek h1, görünür odak, ≥44px hedefler, skip-link,
// tablolara klavye-erişilebilir kaydırma bölgesi. Animasyon: .rv (reveal) sınıfları
// client.js + prefers-reduced-motion kapısıyla çalışır; JS yoksa içerik tam görünür.
import { privacy, terms } from "./legal.mjs";
import {
  APP_URL,
  BRAND,
  CONTACT_EMAIL,
  LANG_NAMES,
  LANG_ORDER,
  OG_LOCALES,
  RTL_LANGS,
  brandMark,
  esc,
  icon,
  jsonLd,
} from "./site.mjs";

/** @typedef {import("./content.tr.mjs").tr} Locale */

/**
 * @param {object} o
 * @param {any} o.L yerel içerik (en/tr/de/…)
 * @param {string} o.path  kanonik yol ("/", "/use-cases/x/")
 * @param {Record<string,string>} o.alts  TÜM dillerdeki eşlenik yollar {lang: path}
 * @param {string} o.title
 * @param {string} o.desc
 * @param {string} o.siteUrl
 * @param {string} o.body
 * @param {unknown[]} [o.ld]  JSON-LD blokları
 * @param {boolean} [o.noindex]
 */
export function layout({ L, path, alts, title, desc, siteUrl, body, ld = [], noindex = false }) {
  const canonical = siteUrl + path;
  const dir = RTL_LANGS.has(L.lang) ? "rtl" : "ltr";
  // N-yönlü hreflang: her dilin eşleniği + x-default → EN (ADR-096 global-first).
  const hreflangs = LANG_ORDER.filter((lng) => alts[lng])
    .map((lng) => `<link rel="alternate" hreflang="${lng}" href="${siteUrl}${alts[lng]}">`)
    .join("\n");
  const xDefault = alts.en
    ? `\n<link rel="alternate" hreflang="x-default" href="${siteUrl}${alts.en}">`
    : "";
  return `<!doctype html>
<html lang="${L.lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex">' : ""}
<link rel="canonical" href="${canonical}">
${hreflangs}${xDefault}
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#F5F7FB">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${BRAND.ink}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${BRAND.name}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${siteUrl}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${OG_LOCALES[L.lang] ?? "en_US"}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/inter-latin-ext.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/site.css">
${ld.map(jsonLd).join("\n")}
</head>
<body>
<a class="skip" href="#main">${esc(L.nav.skip)}</a>
${header(L, path)}
<main id="main">
${body}
</main>
${footer(L, alts)}
<script src="/assets/client.js" defer></script>
</body>
</html>
`;
}

/** @param {any} L @param {string} path */
function header(L, path) {
  const p = L.prefix;
  const links = [
    [`${p}/#how`, L.nav.how],
    [`${L.useCaseBase}/`, L.nav.useCases],
    [`${p}/${L.compare.slug}/`, L.nav.compare],
    [`${p}/#faq`, L.nav.faq],
    [`${p}/${L.about.slug}/`, L.nav.about],
  ];
  const home = p === "" ? "/" : `${p}/`;
  return `<header class="hdr">
  <div class="wrap hdr-in">
    <a class="brand" href="${home}" ${path === home ? 'aria-current="page"' : ""}>
      ${brandMark(28)}<span>${BRAND.name}</span>
    </a>
    <button type="button" class="nav-btn" aria-expanded="false" aria-controls="nav-menu" aria-label="${esc(L.nav.menuLabel)}">
      ${icon("menu", 22)}
    </button>
    <nav id="nav-menu" class="nav" aria-label="${esc(L.nav.useCases)}">
      ${links
        .map(
          ([href, label]) =>
            `<a href="${href}" ${path === href ? 'aria-current="page"' : ""}>${esc(String(label))}</a>`,
        )
        .join("\n      ")}
      <a class="btn btn-primary btn-sm" href="${APP_URL}">${esc(L.nav.openApp)} ${icon("arrowRight", 16)}</a>
    </nav>
  </div>
</header>`;
}

/** Dil değiştirici — 11 dil; her biri eşlenik sayfaya (alts) gider, kendi dilinde adlandırılır.
 *  Aktif dil aria-current ile işaretlenir. @param {any} L @param {Record<string,string>} alts */
function langSwitcher(L, alts) {
  const items = LANG_ORDER.filter((lng) => alts[lng])
    .map((lng) => {
      const current = lng === L.lang ? ' aria-current="true"' : "";
      return `<li><a href="${alts[lng]}" hreflang="${lng}" lang="${lng}"${current}>${esc(LANG_NAMES[lng])}</a></li>`;
    })
    .join("\n          ");
  return `<nav class="ftr-lang" aria-label="${esc(L.footer.langSwitch)}">
        <h2 class="ftr-h">${esc(L.footer.langSwitch)}</h2>
        <ul>
          ${items}
        </ul>
      </nav>`;
}

/** @param {any} L @param {Record<string,string>} alts */
function footer(L, alts) {
  const p = L.prefix;
  const ucLinks = L.useCases
    .map(
      (/** @type {any} */ u) => `<li><a href="${L.useCaseBase}/${u.slug}/">${esc(u.name)}</a></li>`,
    )
    .join("\n        ");
  return `<footer class="ftr">
  <div class="wrap">
    <div class="ftr-grid">
      <div class="ftr-brand">
        <a class="brand" href="${p === "" ? "/" : `${p}/`}">${brandMark(26)}<span>${BRAND.name}</span></a>
        <p>${esc(L.footer.tagline)}</p>
        <p><a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
      </div>
      <nav aria-label="${esc(L.footer.useCases)}">
        <h2 class="ftr-h">${esc(L.footer.useCases)}</h2>
        <ul>
        ${ucLinks}
        </ul>
      </nav>
      <nav aria-label="${esc(L.footer.product)}">
        <h2 class="ftr-h">${esc(L.footer.product)}</h2>
        <ul>
          <li><a href="${p}/#how">${esc(L.nav.how)}</a></li>
          <li><a href="${p}/${L.compare.slug}/">${esc(L.nav.compare)}</a></li>
          <li><a href="${p}/${L.about.slug}/">${esc(L.nav.about)}</a></li>
          <li><a href="${APP_URL}">${esc(L.nav.openApp)}</a></li>
        </ul>
      </nav>
      <nav aria-label="${esc(L.footer.legal)}">
        <h2 class="ftr-h">${esc(L.footer.legal)}</h2>
        <ul>
          <li><a href="${p}/${L.lang === "tr" ? privacy.slugTr : privacy.slugEn}/">${esc(L.footer.privacy)}</a></li>
          <li><a href="${p}/${L.lang === "tr" ? terms.slugTr : terms.slugEn}/">${esc(L.footer.terms)}</a></li>
          <li><a href="/llms.txt">${esc(L.footer.forAi)}</a></li>
        </ul>
      </nav>
      ${langSwitcher(L, alts)}
    </div>
    <p class="ftr-note">© ${new Date().getFullYear()} ${BRAND.name} · ${esc(L.footer.updated)}: <time datetime="${BUILD_DAY}">${BUILD_DAY}</time></p>
  </div>
</footer>`;
}

/** Görünür tazelik damgası (GEO/ADR-097): AI atıf önceliği ~14 günde düştüğünden
 *  her build'de yenilenen tarih tüm sayfaların footer'ında işaretlenir. */
const BUILD_DAY = new Date().toISOString().slice(0, 10);

/** Bası-geri-bildirimli birincil/ikincil buton atomu. @param {string} href @param {string} label @param {"primary"|"ghost"} kind @param {boolean} [withIcon] */
function btn(href, label, kind, withIcon = true) {
  return `<a class="btn btn-${kind}" href="${href}">${esc(label)}${withIcon ? ` ${icon("arrowRight", 18)}` : ""}</a>`;
}

/** SSS bölümü — native progressive disclosure (<details>) + FAQPage JSON-LD build'de eklenir.
 * @param {{q:string,a:string}[]} faq @param {string} heading @param {string} [id] */
function faqSection(faq, heading, id = "faq") {
  return `<section class="sec" id="${id}" aria-labelledby="${id}-h">
  <div class="wrap narrow">
    <h2 id="${id}-h" class="sec-h rv">${esc(heading)}</h2>
    <div class="faq rv">
      ${faq
        .map(
          (f) => `<details class="faq-item">
        <summary>${esc(f.q)}<span class="faq-x" aria-hidden="true">${icon("x", 18)}</span></summary>
        <p>${esc(f.a)}</p>
      </details>`,
        )
        .join("\n      ")}
    </div>
  </div>
</section>`;
}

/** Kapanış CTA bandı. @param {any} L */
function ctaBand(L) {
  return `<section class="cta-band">
  <div class="wrap narrow rv">
    <h2>${esc(L.home.ctaHeading)}</h2>
    <p>${esc(L.home.ctaText)}</p>
    ${btn(APP_URL, L.home.heroCta, "primary")}
    <p class="cta-note">${esc(L.home.heroCtaNote)}</p>
  </div>
</section>`;
}

/** Telefon maketi — ürünün gerçek akışını (watcher kartı + gelen bildirim) canlandırır. @param {any} L */
function phoneMock(L) {
  const ph = L.home.phone;
  return `<div class="hero-visual" role="img" aria-label="${esc(`${ph.watcherText} — ${ph.notifText}`)}">
    <div class="radar" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="phone" aria-hidden="true">
      <div class="phone-top"></div>
      <div class="p-card">
        <span class="p-badge"><span class="p-dot"></span>${esc(ph.watcherLabel)}</span>
        <p class="p-text">${esc(ph.watcherText)}</p>
        <span class="p-meta">${icon("refresh", 14)} ${esc(ph.watcherMeta)}</span>
      </div>
      <div class="p-notif">
        <span class="p-notif-ic">${icon("bellRing", 18)}</span>
        <div class="p-notif-body">
          <strong>${esc(ph.notifTitle)}</strong>
          <p>${esc(ph.notifText)}</p>
          <span class="p-meta p-conf">${icon("shieldCheck", 14)} ${esc(ph.notifMeta)}</span>
        </div>
      </div>
    </div>
  </div>`;
}

/** Ana sayfa gövdesi. @param {any} L */
export function homeBody(L) {
  const H = L.home;
  const ucBase = L.useCaseBase;
  return `<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <p class="overline rv">${esc(H.heroOverline)}</p>
      <h1 class="rv">${H.heroTitle}</h1>
      <p class="lead rv">${esc(H.heroSub)}</p>
      <div class="hero-actions rv">
        ${btn(APP_URL, H.heroCta, "primary")}
        <a class="btn btn-ghost" href="#how">${esc(H.heroSecondary)}</a>
      </div>
      <p class="cta-note rv">${esc(H.heroCtaNote)}</p>
      <ul class="trust rv" aria-label="${esc(H.heroOverline)}">
        ${H.trust
          .map((/** @type {string} */ c) => `<li>${icon("check", 14)}<span>${esc(c)}</span></li>`)
          .join("\n        ")}
      </ul>
    </div>
    ${phoneMock(L)}
  </div>
</section>

<section class="sec" id="how" aria-labelledby="how-h">
  <div class="wrap">
    <h2 id="how-h" class="sec-h rv">${esc(H.howHeading)}</h2>
    <ol class="steps">
      ${H.how
        .map(
          (
            /** @type {any} */ s,
            /** @type {number} */ i,
          ) => `<li class="step rv" style="--d:${i * 70}ms">
        <span class="step-ic">${icon(s.icon, 22)}</span>
        <h3>${esc(s.t)}</h3>
        <p>${esc(s.d)}</p>
      </li>`,
        )
        .join("\n      ")}
    </ol>
  </div>
</section>

<section class="sec" aria-labelledby="feat-h">
  <div class="wrap">
    <h2 id="feat-h" class="sec-h rv">${esc(H.featuresHeading)}</h2>
    <div class="grid3">
      ${H.features
        .map(
          (
            /** @type {any} */ f,
            /** @type {number} */ i,
          ) => `<div class="card rv" style="--d:${(i % 3) * 70}ms">
        <span class="card-ic">${icon(f.icon, 20)}</span>
        <h3>${esc(f.t)}</h3>
        <p>${esc(f.d)}</p>
      </div>`,
        )
        .join("\n      ")}
    </div>
  </div>
</section>

<section class="sec" id="use-cases" aria-labelledby="uc-h">
  <div class="wrap">
    <h2 id="uc-h" class="sec-h rv">${esc(H.useCasesHeading)}</h2>
    <p class="sec-sub rv">${esc(H.useCasesSub)}</p>
    ${useCaseGrid(L)}
    <p class="center rv"><a class="btn btn-ghost" href="${ucBase}/">${esc(H.useCasesAll)} ${icon("arrowRight", 18)}</a></p>
  </div>
</section>

<section class="sec" id="pricing" aria-labelledby="pr-h">
  <div class="wrap narrow">
    <h2 id="pr-h" class="sec-h rv">${esc(H.pricingHeading)}</h2>
    <div class="price-grid">
      <div class="card price rv">
        <h3>${esc(H.pricing.freeName)}</h3>
        <ul>${H.pricing.freeBullets.map((/** @type {string} */ b) => `<li>${icon("check", 18)} ${esc(b)}</li>`).join("")}</ul>
        ${btn(APP_URL, H.pricing.freeCta, "ghost")}
      </div>
      <div class="card price price-pro rv" style="--d:90ms">
        <span class="price-badge">${esc(H.pricing.proBadge)}</span>
        <h3>${esc(H.pricing.proName)}</h3>
        <ul>${H.pricing.proBullets.map((/** @type {string} */ b) => `<li>${icon("check", 18)} ${esc(b)}</li>`).join("")}</ul>
        ${btn(APP_URL, H.pricing.proCta, "primary")}
      </div>
    </div>
    <p class="cta-note center rv">${esc(H.pricing.note)}</p>
  </div>
</section>

${faqSection(H.faq, H.faqHeading)}
${ctaBand(L)}`;
}

/** Çözüm kartları ızgarası. @param {any} L @param {string[]} [only] */
function useCaseGrid(L, only) {
  const items = only
    ? L.useCases.filter((/** @type {any} */ u) => only.includes(u.slug))
    : L.useCases;
  return `<div class="grid3 uc-grid">
      ${items
        .map(
          (
            /** @type {any} */ u,
            /** @type {number} */ i,
          ) => `<a class="card uc-card rv" style="--d:${(i % 3) * 70}ms" href="${L.useCaseBase}/${u.slug}/">
        <span class="card-ic">${icon(u.icon, 20)}</span>
        <h3>${esc(u.name)}</h3>
        <p>${esc(u.answer.split(";")[0].split(".")[0])}.</p>
        <span class="uc-more">${icon("arrowRight", 16)}</span>
      </a>`,
        )
        .join("\n      ")}
    </div>`;
}

/** Kırıntı navigasyonu. @param {any} L @param {[string,string][]} items */
function breadcrumb(L, items) {
  return `<nav class="crumb" aria-label="breadcrumb"><ol>
    <li><a href="${L.prefix === "" ? "/" : `${L.prefix}/`}">${BRAND.name}</a></li>
    ${items
      .map((c, i) =>
        i === items.length - 1
          ? `<li aria-current="page">${esc(c[1])}</li>`
          : `<li><a href="${c[0]}">${esc(c[1])}</a></li>`,
      )
      .join("\n    ")}
  </ol></nav>`;
}

/** Çözüm sayfası gövdesi. @param {any} L @param {any} u */
export function useCaseBody(L, u) {
  const related = L.useCases.filter((/** @type {any} */ r) => u.related.includes(r.slug));
  const S = L.ucStrings;
  const contextHeading = S.context;
  const exHeading = S.examples;
  const exHint = S.exHint;
  const relHeading = S.related;
  const faqHeading = S.faq;
  return `<article>
<section class="sec sec-first">
  <div class="wrap narrow">
    ${breadcrumb(L, [
      [`${L.useCaseBase}/`, L.nav.useCases],
      ["", u.name],
    ])}
    <h1 class="rv">${esc(u.h1)}</h1>
    <p class="lead answer rv">${esc(u.answer)}</p>
    <div class="hero-actions rv">${btn(APP_URL, L.home.heroCta, "primary")}</div>
  </div>
</section>

<section class="sec" aria-labelledby="ctx-h">
  <div class="wrap narrow">
    <h2 id="ctx-h" class="sec-h rv">${esc(contextHeading)}</h2>
    <ul class="pains">
      ${u.context
        .map(
          (/** @type {string} */ p, /** @type {number} */ i) =>
            `<li class="rv" style="--d:${i * 70}ms">${icon("check", 18)}<span>${esc(p)}</span></li>`,
        )
        .join("\n      ")}
    </ul>
  </div>
</section>

<section class="sec" aria-labelledby="ex-h">
  <div class="wrap narrow">
    <h2 id="ex-h" class="sec-h rv">${esc(exHeading)}</h2>
    <p class="sec-sub rv">${esc(exHint)}</p>
    <ul class="examples">
      ${u.examples
        .map(
          (
            /** @type {string} */ e,
            /** @type {number} */ i,
          ) => `<li class="example rv" style="--d:${i * 70}ms">
        <q>${esc(e)}</q>
        <button type="button" class="copy-btn" data-copy="${esc(e)}" data-copied="${esc(S.copied)}">
          ${icon("copy", 16)}<span>${esc(S.copy)}</span>
        </button>
      </li>`,
        )
        .join("\n      ")}
    </ul>
  </div>
</section>

${faqSection(u.faq, faqHeading, "uc-faq")}

<section class="sec" aria-labelledby="rel-h">
  <div class="wrap">
    <h2 id="rel-h" class="sec-h rv">${esc(relHeading)}</h2>
    ${useCaseGrid(
      L,
      related.map((/** @type {any} */ r) => r.slug),
    )}
  </div>
</section>
${ctaBand(L)}
</article>`;
}

/** Çözümler dizini. @param {any} L */
export function useCasesIndexBody(L) {
  const I = L.useCasesIndex;
  return `<section class="sec sec-first">
  <div class="wrap">
    ${breadcrumb(L, [["", I.h1]])}
    <h1 class="rv">${esc(I.h1)}</h1>
    <p class="lead rv">${esc(I.intro)}</p>
    ${useCaseGrid(L)}
  </div>
</section>
${ctaBand(L)}`;
}

/** Karşılaştırma sayfası. @param {any} L */
export function compareBody(L) {
  const C = L.compare;
  const cols = ["Google Alerts", "Visualping", "Distill"];
  return `<section class="sec sec-first">
  <div class="wrap">
    ${breadcrumb(L, [["", L.nav.compare]])}
    <h1 class="rv">${esc(C.h1)}</h1>
    <p class="lead answer rv">${esc(C.answer)}</p>
    <p class="sec-sub rv">${esc(C.intro)}</p>
    <div class="tscroll rv" role="region" aria-label="${esc(C.tableCaption)}" tabindex="0">
      <table>
        <caption>${esc(C.tableCaption)}</caption>
        <thead>
          <tr><th scope="col"></th><th scope="col" class="t-self">${esc(C.colSelf)}</th>${cols
            .map((c) => `<th scope="col">${esc(c)}</th>`)
            .join("")}</tr>
        </thead>
        <tbody>
          ${C.rows
            .map(
              (/** @type {any} */ r) =>
                `<tr><th scope="row">${esc(r.f)}</th><td class="t-self">${esc(r.self)}</td><td>${esc(r.ga)}</td><td>${esc(r.vp)}</td><td>${esc(r.di)}</td></tr>`,
            )
            .join("\n          ")}
        </tbody>
      </table>
    </div>
    <p class="lead rv">${esc(C.afterTable)}</p>
  </div>
</section>

<section class="sec" aria-labelledby="cmp-deep-h">
  <div class="wrap">
    <h2 id="cmp-deep-h" class="sec-h rv">${esc(C.toolsHeading)}</h2>
    <div class="grid3">
      ${C.tools
        .map(
          (/** @type {any} */ t, /** @type {number} */ i) =>
            `<a class="card uc-card rv" style="--d:${(i % 3) * 70}ms" href="${L.prefix}/${C.slug}/${t.slug}/">
        <h3>${esc(t.h1)}</h3>
        <p>${esc(t.metaDescription)}</p>
        <span class="uc-more">${icon("arrowRight", 16)}</span>
      </a>`,
        )
        .join("\n      ")}
    </div>
  </div>
</section>
${faqSection(C.faq, L.home.faqHeading, "cmp-faq")}
${ctaBand(L)}`;
}

/** Rakip-bazlı derin karşılaştırma sayfası (GEO/ADR-097) — dürüstlük: rakibin
 *  güçlü yanları açıkça listelenir; tablo ana sayfanın TEK kaynağındaki satırlardan türer.
 *  @param {any} L @param {any} t */
export function compareToolBody(L, t) {
  const C = L.compare;
  return `<article>
<section class="sec sec-first">
  <div class="wrap narrow">
    ${breadcrumb(L, [
      [`${L.prefix}/${C.slug}/`, L.nav.compare],
      ["", t.h1],
    ])}
    <h1 class="rv">${esc(t.h1)}</h1>
    <p class="lead answer rv">${esc(t.answer)}</p>
    <div class="hero-actions rv">${btn(APP_URL, L.home.heroCta, "primary")}</div>
  </div>
</section>

<section class="sec" aria-labelledby="ct-table-h">
  <div class="wrap narrow">
    <h2 id="ct-table-h" class="sec-h rv">${esc(C.tableCaption)}</h2>
    <div class="tscroll rv" role="region" aria-label="${esc(C.tableCaption)}" tabindex="0">
      <table>
        <caption>${esc(t.h1)}</caption>
        <thead>
          <tr><th scope="col"></th><th scope="col" class="t-self">${esc(C.colSelf)}</th><th scope="col">${esc(t.name)}</th></tr>
        </thead>
        <tbody>
          ${C.rows
            .map(
              (/** @type {any} */ r) =>
                `<tr><th scope="row">${esc(r.f)}</th><td class="t-self">${esc(r.self)}</td><td>${esc(r[t.col])}</td></tr>`,
            )
            .join("\n          ")}
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="sec" aria-labelledby="ct-str-h">
  <div class="wrap narrow">
    <h2 id="ct-str-h" class="sec-h rv">${esc(C.strengthsHeading.replace("{name}", t.name))}</h2>
    <ul class="pains">
      ${t.strengths
        .map(
          (/** @type {string} */ s, /** @type {number} */ i) =>
            `<li class="rv" style="--d:${i * 70}ms">${icon("check", 18)}<span>${esc(s)}</span></li>`,
        )
        .join("\n      ")}
    </ul>
    <h2 class="sec-h rv">${esc(C.whenHeading)}</h2>
    <ul class="pains">
      ${t.whenWhenly
        .map(
          (/** @type {string} */ s, /** @type {number} */ i) =>
            `<li class="rv" style="--d:${i * 70}ms">${icon("zap", 18)}<span>${esc(s)}</span></li>`,
        )
        .join("\n      ")}
    </ul>
  </div>
</section>

${faqSection(t.faq, L.home.faqHeading, "ct-faq")}
${ctaBand(L)}
</article>`;
}

/** Hakkında sayfası. @param {any} L */
export function aboutBody(L) {
  const A = L.about;
  return `<section class="sec sec-first">
  <div class="wrap narrow">
    ${breadcrumb(L, [["", A.h1]])}
    <h1 class="rv">${esc(A.h1)}</h1>
    ${A.paras.map((/** @type {string} */ p) => `<p class="about-p rv">${esc(p)}</p>`).join("\n    ")}
    <h2 class="sec-h rv">${esc(A.factsHeading)}</h2>
    <div class="tscroll rv" role="region" aria-label="${esc(A.factsHeading)}" tabindex="0">
      <table>
        <tbody>
        ${A.facts
          .map(
            (/** @type {any} */ f) =>
              `<tr><th scope="row">${esc(f.k)}</th><td>${esc(String(f.v).replace("__EMAIL__", CONTACT_EMAIL))}</td></tr>`,
          )
          .join("\n        ")}
        </tbody>
      </table>
    </div>
  </div>
</section>
${ctaBand(L)}`;
}

/** Hukuki sayfa. TR+EN dışındaki dillerde EN metni + "bağlayıcı sürüm EN" notu basılır.
 *  @param {any} L @param {{title:string,sections:{h:string,p:string}[]}} doc
 *  @param {string} version @param {string} updated @param {string} [translatedNote] */
export function legalBody(L, doc, version, updated, translatedNote) {
  const note = translatedNote ? `\n    <p class="cta-note">${esc(translatedNote)}</p>` : "";
  return `<section class="sec sec-first">
  <div class="wrap narrow legal">
    ${breadcrumb(L, [["", doc.title]])}
    <h1>${esc(doc.title)}</h1>
    <p class="cta-note">${esc(L.legalCommon.versionLabel)}: ${esc(version)} · ${esc(L.legalCommon.updatedLabel)}: <time datetime="${esc(updated)}">${esc(updated)}</time></p>
    <p class="cta-note">${esc(L.legalCommon.canonicalNote)}</p>${note}
    ${doc.sections.map((s) => `<h2>${esc(s.h)}</h2>\n    <p>${esc(s.p)}</p>`).join("\n    ")}
  </div>
</section>`;
}

/** 404 sayfası. @param {any} L */
export function notFoundBody(L) {
  return `<section class="sec sec-first">
  <div class="wrap narrow center nf">
    <h1>${esc(L.notFound.h1)}</h1>
    <p class="lead">${esc(L.notFound.text)}</p>
    ${btn(L.prefix === "" ? "/" : `${L.prefix}/`, L.notFound.cta, "primary", false)}
  </div>
</section>`;
}
