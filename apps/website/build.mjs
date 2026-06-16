// Whenly tanıtım sitesi üreticisi — sıfır çalışma-zamanı bağımlılığı (SSG).
// Neden statik HTML: AI crawler'lar (GPTBot/ClaudeBot/PerplexityBot) JavaScript
// ÇALIŞTIRMAZ (Vercel/MERJ ağ ölçümü) — içerik ilk HTML'de olmak zorunda.
// Tek içerik kaynağından HTML + sitemap.xml + robots.txt + llms.txt türetilir.
// Kullanım: node build.mjs [--serve] · SITE_URL env ile kanonik adres değişir.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ar } from "./src/content.ar.mjs";
import { de } from "./src/content.de.mjs";
import { en } from "./src/content.en.mjs";
import { es } from "./src/content.es.mjs";
import { fr } from "./src/content.fr.mjs";
import { hi } from "./src/content.hi.mjs";
import { ja } from "./src/content.ja.mjs";
import { pt } from "./src/content.pt.mjs";
import { ru } from "./src/content.ru.mjs";
import { tr } from "./src/content.tr.mjs";
import { zh } from "./src/content.zh.mjs";
import { privacy, terms } from "./src/legal.mjs";
import {
  aboutBody,
  compareBody,
  compareToolBody,
  homeBody,
  layout,
  legalBody,
  notFoundBody,
  useCaseBody,
  useCasesIndexBody,
} from "./src/render.mjs";
import { API_URL, APP_URL, BRAND, CONTACT_EMAIL, INDEXNOW_KEY, SITE_URL } from "./src/site.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));

/**
 * Dil kütüğü (ADR-096 global-first → N-dil): EN kök (prefix:""); kalan 10 dil önekli.
 * Sıra mobil i18n SUPPORTED_LANGS ile hizalı (en, tr ilk; sonra büyüklük sırası).
 * Eşlenik eşleştirme `key`/sayfa-tipi üzerinden yapılır — ikili SLUG_MAP kaldırıldı.
 * @type {any[]}
 */
export const LOCALES = [en, tr, de, es, fr, pt, ru, ar, hi, ja, zh];

/** RTL diller (layout `dir` + minimal CSS için). */
export const RTL_LANGS = new Set(["ar"]);

/** Hukuk belgesinin İngilizce metni TR+EN dışındaki dillerde gösterilir (bağlayıcı = EN). */
const CANONICAL_LEGAL_LANGS = new Set(["tr", "en"]);

/** @param {string} siteUrl */
function orgLd(siteUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    url: siteUrl,
    logo: `${siteUrl}/favicon.svg`,
    email: CONTACT_EMAIL,
  };
}

/** Tazelik sinyali — her build'de güncellenir (GEO: AI asistanları taze içerik alıntılar). */
const BUILD_DATE = new Date().toISOString().slice(0, 10);

/** @param {string} siteUrl @param {string} lang */
function websiteLd(siteUrl, lang) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND.name,
    url: siteUrl,
    inLanguage: lang,
  };
}

/** @param {string} siteUrl @param {any} L */
function softwareLd(siteUrl, L) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: BRAND.name,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web, Android",
    url: APP_URL,
    description: L.home.metaDescription,
    inLanguage: ["tr", "en", "ar", "de", "es", "fr", "hi", "ja", "pt", "ru", "zh"],
    datePublished: "2026-06-12",
    dateModified: BUILD_DATE,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description:
        L.lang === "tr"
          ? "Ücretsiz plan: 3 aktif izleme. Pro abonelik uygulama içinden."
          : "Free plan: 3 active watches. Pro subscription available in-app.",
    },
    featureList: L.home.features.map((/** @type {any} */ f) => f.t),
    publisher: orgLd(siteUrl),
  };
}

/**
 * HowTo şeması (GEO/ADR-097): "how to get notified when …" prompt'ları için
 * çözüm sayfalarına kurulum adımları — örnek cümle gerçek içerikten gelir.
 * @param {any} L @param {any} u
 */
function howToLd(L, u) {
  const tr = L.lang === "tr";
  const steps = [
    {
      name: tr ? "Whenly'yi aç" : "Open Whenly",
      text: tr
        ? "Web uygulamasını tarayıcıda ya da Android uygulamasını aç — ücretsiz plan kart istemez."
        : "Open the web app in your browser or the Android app — the free plan needs no card.",
    },
    {
      name: tr ? "Olayı tek cümleyle tarif et" : "Describe the event in one sentence",
      text: tr ? `Örneğin: "${u.examples[0]}"` : `For example: "${u.examples[0]}"`,
    },
    {
      name: tr ? "Gerçekleşince haber al" : "Get notified when it happens",
      text: tr
        ? "Whenly açık kaynakları belirli aralıklarla kontrol eder; olay göründüğünde bildirim gönderir, istersen alarm çaldırır."
        : "Whenly checks public sources at regular intervals and sends a notification — or rings an alarm — when your event appears.",
    },
  ];
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: tr ? `Whenly ile ${u.name} kurulumu` : `How to set up ${u.name} with Whenly`,
    step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, ...s })),
  };
}

/** @param {{q:string,a:string}[]} faq */
function faqLd(faq) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** @param {string} siteUrl @param {[string,string][]} items  [url, ad] çiftleri */
function breadcrumbLd(siteUrl, items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([url, name], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      ...(url ? { item: siteUrl + url } : {}),
    })),
  };
}

/** Bir dilde bir sayfa-tipinin kanonik yolu (tüm diller için eşlenik hesabında kullanılır).
 *  Eşlenik anahtarları: use-case → `key`; legal → "privacy"/"terms"; compareTool → araç slug'ı
 *  (tüm dillerde aynı). Bulunamazsa null (örn. dilde olmayan use-case — pratikte hep var).
 *  @param {any} L @param {string} type @param {string} [key]
 *  @returns {string|null} */
function pathForType(L, type, key) {
  const home = L.prefix === "" ? "/" : `${L.prefix}/`;
  switch (type) {
    case "home":
      return home;
    case "ucIndex":
      return `${L.useCaseBase}/`;
    case "uc": {
      const u = L.useCases.find((/** @type {any} */ x) => x.key === key);
      return u ? `${L.useCaseBase}/${u.slug}/` : null;
    }
    case "compare":
      return `${L.prefix}/${L.compare.slug}/`;
    case "compareTool": {
      const t = L.compare.tools.find((/** @type {any} */ x) => x.slug === key);
      return t ? `${L.prefix}/${L.compare.slug}/${t.slug}/` : null;
    }
    case "about":
      return `${L.prefix}/${L.about.slug}/`;
    case "legal": {
      const doc = key === "privacy" ? privacy : terms;
      const slug = L.lang === "tr" ? doc.slugTr : doc.slugEn;
      return `${L.prefix}/${slug}/`;
    }
    default:
      return null;
  }
}

/** Bir sayfanın TÜM dillerdeki eşlenik yol haritası `{lang: path}` (N-yönlü hreflang + switcher).
 *  @param {string} type @param {string} [key] @returns {Record<string,string>} */
function altsFor(type, key) {
  /** @type {Record<string,string>} */
  const alts = {};
  for (const L2 of LOCALES) {
    const p = pathForType(L2, type, key);
    if (p) alts[L2.lang] = p;
  }
  return alts;
}

/**
 * Sayfa modeli — her sayfa: yol, TÜM dillerdeki eşlenikler (alts), başlık/özet, gövde, JSON-LD.
 * @param {string} siteUrl
 * @returns {Array<{path:string,alts:Record<string,string>,L:any,title:string,desc:string,body:string,ld:unknown[],noindex?:boolean,md:string}>}
 */
export function pageModel(siteUrl) {
  /** @type {Array<{path:string,alts:Record<string,string>,L:any,title:string,desc:string,body:string,ld:unknown[],noindex?:boolean,md:string}>} */
  const pages = [];
  /** @param {any} L @param {string} slug */
  const ucPath = (L, slug) => `${L.useCaseBase}/${slug}/`;

  for (const L of LOCALES) {
    const home = L.prefix === "" ? "/" : `${L.prefix}/`;

    // Ana sayfa
    pages.push({
      path: home,
      alts: altsFor("home"),
      L,
      title: L.home.metaTitle,
      desc: L.home.metaDescription,
      body: homeBody(L),
      ld: [orgLd(siteUrl), websiteLd(siteUrl, L.lang), softwareLd(siteUrl, L), faqLd(L.home.faq)],
      md: `${L.home.heroSub}\n\n${L.home.how
        .map((/** @type {any} */ s) => `- ${s.t}: ${s.d}`)
        .join("\n")}\n\n${L.home.faq
        .map((/** @type {any} */ f) => `**${f.q}** ${f.a}`)
        .join("\n\n")}`,
    });

    // Çözümler dizini
    pages.push({
      path: `${L.useCaseBase}/`,
      alts: altsFor("ucIndex"),
      L,
      title: L.useCasesIndex.metaTitle,
      desc: L.useCasesIndex.metaDescription,
      body: useCasesIndexBody(L),
      ld: [breadcrumbLd(siteUrl, [[`${L.useCaseBase}/`, L.useCasesIndex.h1]])],
      md: `${L.useCasesIndex.intro}\n\n${L.useCases
        .map((/** @type {any} */ u) => `- [${u.name}](${siteUrl}${ucPath(L, u.slug)})`)
        .join("\n")}`,
    });

    // Çözüm sayfaları
    for (const u of L.useCases) {
      pages.push({
        path: ucPath(L, u.slug),
        alts: altsFor("uc", u.key),
        L,
        title: u.metaTitle,
        desc: u.metaDescription,
        body: useCaseBody(L, u),
        ld: [
          breadcrumbLd(siteUrl, [
            [`${L.useCaseBase}/`, L.nav.useCases],
            [ucPath(L, u.slug), u.name],
          ]),
          faqLd(u.faq),
          howToLd(L, u),
        ],
        md: `${u.answer}\n\n${u.context.map((/** @type {string} */ p) => `- ${p}`).join("\n")}\n\n${
          L.lang === "tr" ? "Örnek izleme cümleleri" : "Example watch sentences"
        }:\n${u.examples.map((/** @type {string} */ e) => `- "${e}"`).join("\n")}\n\n${u.faq
          .map((/** @type {any} */ f) => `**${f.q}** ${f.a}`)
          .join("\n\n")}`,
      });
    }

    // Karşılaştırma
    pages.push({
      path: `${L.prefix}/${L.compare.slug}/`,
      alts: altsFor("compare"),
      L,
      title: L.compare.metaTitle,
      desc: L.compare.metaDescription,
      body: compareBody(L),
      ld: [
        breadcrumbLd(siteUrl, [[`${L.prefix}/${L.compare.slug}/`, L.compare.h1]]),
        faqLd(L.compare.faq),
      ],
      md: `${L.compare.answer}\n\n${L.compare.rows
        .map(
          (/** @type {any} */ r) =>
            `- ${r.f} — Whenly: ${r.self} · Google Alerts: ${r.ga} · Visualping: ${r.vp} · Distill: ${r.di}`,
        )
        .join("\n")}\n\n${L.compare.afterTable}`,
    });

    // Rakip-bazlı derin karşılaştırmalar (GEO/ADR-097) — slug tüm dillerde aynı.
    for (const t of L.compare.tools) {
      pages.push({
        path: `${L.prefix}/${L.compare.slug}/${t.slug}/`,
        alts: altsFor("compareTool", t.slug),
        L,
        title: t.metaTitle,
        desc: t.metaDescription,
        body: compareToolBody(L, t),
        ld: [
          breadcrumbLd(siteUrl, [
            [`${L.prefix}/${L.compare.slug}/`, L.nav.compare],
            [`${L.prefix}/${L.compare.slug}/${t.slug}/`, t.h1],
          ]),
          faqLd(t.faq),
        ],
        md: `${t.answer}\n\n${L.compare.strengthsHeading.replace("{name}", t.name)}:\n${t.strengths
          .map((/** @type {string} */ s) => `- ${s}`)
          .join("\n")}\n\n${L.compare.whenHeading}:\n${t.whenWhenly
          .map((/** @type {string} */ s) => `- ${s}`)
          .join("\n")}\n\n${t.faq.map((/** @type {any} */ f) => `**${f.q}** ${f.a}`).join("\n\n")}`,
      });
    }

    // Hakkında
    pages.push({
      path: `${L.prefix}/${L.about.slug}/`,
      alts: altsFor("about"),
      L,
      title: L.about.metaTitle,
      desc: L.about.metaDescription,
      body: aboutBody(L),
      ld: [breadcrumbLd(siteUrl, [[`${L.prefix}/${L.about.slug}/`, L.about.h1]])],
      md: L.about.paras.join("\n\n"),
    });

    // Hukuki sayfalar — TR+EN kanonik kendi dilinde; kalan diller EN metni + "bağlayıcı = EN" notu.
    for (const [docKey, doc] of /** @type {[string, typeof privacy][]} */ ([
      ["privacy", privacy],
      ["terms", terms],
    ])) {
      const slug = L.lang === "tr" ? doc.slugTr : doc.slugEn;
      const localized = L.lang === "tr" ? doc.tr : doc.en;
      const translatedNote = CANONICAL_LEGAL_LANGS.has(L.lang)
        ? undefined
        : L.legalCommon.translatedNote;
      pages.push({
        path: `${L.prefix}/${slug}/`,
        alts: altsFor("legal", docKey),
        L,
        title: `${localized.title} — ${BRAND.name}`,
        desc: localized.sections[0].p.slice(0, 155),
        body: legalBody(L, localized, doc.version, doc.updated, translatedNote),
        ld: [breadcrumbLd(siteUrl, [[`${L.prefix}/${slug}/`, localized.title]])],
        md: localized.sections.map((s) => `### ${s.h}\n${s.p}`).join("\n\n"),
      });
    }
  }
  return pages;
}

/** @param {ReturnType<typeof pageModel>} pages @param {string} siteUrl */
function sitemapXml(pages, siteUrl) {
  const today = new Date().toISOString().slice(0, 10);
  const entries = pages
    .filter((p) => !p.noindex)
    .map((p) => {
      // x-default → EN (ADR-096 global-first): dil eşleşmeyen ziyaretçi EN görür.
      const alts = LOCALES.map((L2) => {
        const ap = p.alts[L2.lang];
        return ap
          ? `    <xhtml:link rel="alternate" hreflang="${L2.lang}" href="${siteUrl}${ap}"/>`
          : "";
      })
        .filter(Boolean)
        .join("\n");
      const xDefault = p.alts.en
        ? `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}${p.alts.en}"/>`
        : "";
      return `  <url>
    <loc>${siteUrl}${p.path}</loc>
    <lastmod>${today}</lastmod>
${alts}${xDefault}
  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>
`;
}

/** AI asistan/arama botlarına açık robots.txt — niyet açıkça yazılır (GEO mimarisi). @param {string} siteUrl */
function robotsTxt(siteUrl) {
  const aiBots = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-SearchBot",
    "Claude-User",
    "anthropic-ai",
    "PerplexityBot",
    "Perplexity-User",
    "Google-Extended",
    "Applebot",
    "CCBot",
    "Meta-ExternalAgent",
    "Meta-ExternalFetcher",
    "Bingbot",
    "Amazonbot",
  ];
  return `# Whenly — tüm arama ve AI asistan botlarına açık.
# AI crawler'lara izin bilinçlidir (GEO): asistanların ürünü tanıması istenir.

User-agent: *
Allow: /

${aiBots.map((b) => `User-agent: ${b}\nAllow: /`).join("\n\n")}

Sitemap: ${siteUrl}/sitemap.xml
`;
}

/** llms.txt — kısa site haritası (llmstxt.org biçimi). @param {ReturnType<typeof pageModel>} pages @param {string} siteUrl */
function llmsTxt(pages, siteUrl) {
  /** @param {any} p */
  const line = (p) => `- [${p.title}](${siteUrl}${p.path}): ${p.desc}`;
  // Dil bölümleri: EN + TR önde (kanonik diller), kalan diller alfabetik olarak izler.
  const sections = LOCALES.map((L2) => {
    const lp = pages.filter((p) => p.L.lang === L2.lang && !p.noindex);
    return `## ${L2.langName} (${L2.lang})\n\n${lp.map(line).join("\n")}`;
  }).join("\n\n");
  return `# ${BRAND.name}

> Whenly is a monitoring and alerts app. You describe what you want to watch in plain
> language (for example, "tell me when this product is back in stock under $500" or
> "alert me when a 2-bedroom under $1,500 is listed here"); Whenly checks public web
> sources at regular intervals and sends a notification — or a real alarm — when it
> appears. Web and Android, 11 interface languages. Free plan: 3 active watches; Pro
> adds more watches, more frequent checks and alarm mode. The app is at ${APP_URL}.
> Limits, stated plainly: it only watches public pages (not pages behind a login,
> password or captcha), and check timing is best-effort, not guaranteed.

${sections}

## Full content

- [llms-full.txt](${siteUrl}/llms-full.txt): all page content in markdown
`;
}

/** llms-full.txt — tüm sayfa içerikleri markdown olarak. @param {ReturnType<typeof pageModel>} pages @param {string} siteUrl */
function llmsFullTxt(pages, siteUrl) {
  return `${pages
    .filter((p) => !p.noindex)
    .map((p) => `# ${p.title}\nURL: ${siteUrl}${p.path}\n\n${p.desc}\n\n${p.md}`)
    .join("\n\n---\n\n")}\n`;
}

const VERCEL_CONFIG = {
  trailingSlash: true,
  // ADR-096 global-first taşınması: eski kök-TR ve /en yolları 301 ile yeni
  // adreslerine gider — indekslenmiş bağlantı kırılmaz, SEO değeri devrolur.
  redirects: [
    { source: "/en", destination: "/", permanent: true },
    { source: "/en/:path*", destination: "/:path*", permanent: true },
    { source: "/cozumler", destination: "/tr/cozumler", permanent: true },
    { source: "/cozumler/:path*", destination: "/tr/cozumler/:path*", permanent: true },
    { source: "/karsilastirma", destination: "/tr/karsilastirma", permanent: true },
    { source: "/hakkinda", destination: "/tr/hakkinda", permanent: true },
    { source: "/gizlilik", destination: "/tr/gizlilik", permanent: true },
    { source: "/kullanim-kosullari", destination: "/tr/kullanim-kosullari", permanent: true },
  ],
  headers: [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ],
    },
    {
      source: "/(fonts|assets)/(.*)",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    },
  ],
};

/**
 * Siteyi üret. Testlerden de çağrılır (saf, parametrik).
 * @param {{ outDir?: string, siteUrl?: string }} [opts]
 */
export function buildSite(opts = {}) {
  const outDir = opts.outDir ?? path.join(ROOT, "dist");
  const siteUrl = (opts.siteUrl ?? SITE_URL).replace(/\/$/, "");
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  // Statik varlıklar
  cpSync(path.join(ROOT, "public"), outDir, { recursive: true });
  mkdirSync(path.join(outDir, "assets"), { recursive: true });
  cpSync(path.join(ROOT, "src/styles.css"), path.join(outDir, "assets/site.css"));
  // client.js kopyalanırken beacon hedefi tek kaynaktan gömülür (ADR-091).
  writeFileSync(
    path.join(outDir, "assets/client.js"),
    readFileSync(path.join(ROOT, "src/client.js"), "utf8").replaceAll("__API_URL__", API_URL),
  );

  const pages = pageModel(siteUrl);
  for (const p of pages) {
    const html = layout({ ...p, siteUrl });
    const file = path.join(outDir, p.path.replace(/\/$/, "/index.html"));
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, html);
  }

  // 404 (Vercel statikte 404.html'i otomatik kullanır) — kök dil EN (ADR-096).
  writeFileSync(
    path.join(outDir, "404.html"),
    layout({
      L: en,
      path: "/404.html",
      alts: altsFor("home"),
      title: en.notFound.metaTitle,
      desc: en.notFound.text,
      siteUrl,
      body: notFoundBody(en),
      noindex: true,
    }),
  );

  writeFileSync(path.join(outDir, "sitemap.xml"), sitemapXml(pages, siteUrl));
  writeFileSync(path.join(outDir, "robots.txt"), robotsTxt(siteUrl));
  writeFileSync(path.join(outDir, "llms.txt"), llmsTxt(pages, siteUrl));
  writeFileSync(path.join(outDir, "llms-full.txt"), llmsFullTxt(pages, siteUrl));
  writeFileSync(path.join(outDir, `${INDEXNOW_KEY}.txt`), `${INDEXNOW_KEY}\n`);
  writeFileSync(path.join(outDir, "vercel.json"), `${JSON.stringify(VERCEL_CONFIG, null, 2)}\n`);

  return { outDir, siteUrl, pageCount: pages.length, paths: pages.map((p) => p.path) };
}

/** Mini dev sunucusu — yalnız yerel önizleme için. @param {string} dir */
function serve(dir) {
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css",
    ".js": "text/javascript",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".woff2": "font/woff2",
    ".xml": "application/xml",
    ".txt": "text/plain; charset=utf-8",
    ".json": "application/json",
  };
  const srv = http.createServer((req, res) => {
    const url = (req.url ?? "/").split("?")[0];
    // Bozuk %-kaçışı çökertmesin; çözülen yol dist dışına ÇIKAMASIN (traversal koruması).
    let decoded;
    try {
      decoded = decodeURIComponent(url);
    } catch {
      res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
      res.end("400");
      return;
    }
    let file = path.normalize(path.join(dir, decoded));
    if (file !== dir && !file.startsWith(dir + path.sep)) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("404");
      return;
    }
    if (url.endsWith("/")) file = path.join(file, "index.html");
    try {
      const data = readFileSync(file);
      const ext = path.extname(file);
      res.writeHead(200, {
        "content-type":
          types[/** @type {keyof typeof types} */ (ext)] ?? "application/octet-stream",
      });
      res.end(data);
    } catch {
      res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      try {
        res.end(readFileSync(path.join(dir, "404.html")));
      } catch {
        res.end("404");
      }
    }
  });
  const port = Number(process.env.PORT ?? 4321);
  srv.listen(port, () => console.log(`Önizleme: http://localhost:${port}/`));
}

// CLI girişi
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { outDir, pageCount, siteUrl } = buildSite();
  console.log(`✓ ${pageCount} sayfa üretildi → ${outDir} (kanonik: ${siteUrl})`);
  if (process.argv.includes("--serve")) serve(outDir);
}
