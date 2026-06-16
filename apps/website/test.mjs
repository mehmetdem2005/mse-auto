// Build doğrulama testleri (node:test, sıfır bağımlılık) — site her üretimde şu
// değişmezleri korur: kırık iç bağlantı yok, her sayfada SEO/GEO başlıkları tam,
// hreflang N-yönlü ve simetrik (11 dil), sitemap birebir, robots/llms dosyaları
// yerinde, emoji yasağı, a11y değişmezleri, use-case `key` paritesi tüm dillerde.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { LOCALES, buildSite, pageModel } from "./build.mjs";
import { en } from "./src/content.en.mjs";
import { privacy, terms } from "./src/legal.mjs";
import { APP_URL, LANG_NAMES, LANG_ORDER } from "./src/site.mjs";

const SITE = "https://example.test";
const OUT = path.join(tmpdir(), `whenly-site-test-${process.pid}`);
const result = buildSite({ outDir: OUT, siteUrl: SITE });
const pages = pageModel(SITE);

/** Beklenen dil kümesi (build LOCALES ile site.mjs LANG_ORDER aynı 11 dili taşır). */
const LANGS = LOCALES.map((/** @type {any} */ L) => L.lang);
/** Her dilin sayfa kalıbı: 1 ana + 1 dizin + 9 çözüm + 1 karşılaştırma + 3 rakip + 1 hakkında + 2 hukuki = 18. */
const PAGES_PER_LOCALE = 18;
/** Her dilin ana sayfa yolu (EN kök "/", kalanlar "/<lang>/"). */
const homeOf = (/** @type {string} */ lang) =>
  lang === "en" ? "index.html" : `${lang}/index.html`;

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}
const htmlFiles = walk(OUT).filter((f) => f.endsWith(".html"));

test("11 dil kütüğü: build LOCALES ve site.mjs LANG_ORDER aynı dil kümesini taşır", () => {
  assert.equal(LANGS.length, 11, "11 dil bekleniyor");
  assert.deepEqual([...LANGS].sort(), [...LANG_ORDER].sort(), "LOCALES ↔ LANG_ORDER kümesi");
  for (const lang of LANGS) assert.ok(LANG_NAMES[lang], `${lang} için yerel dil adı yok`);
});

test(`her sayfa üretildi (11 dil × ${PAGES_PER_LOCALE} = ${11 * PAGES_PER_LOCALE})`, () => {
  assert.equal(result.pageCount, 11 * PAGES_PER_LOCALE);
  assert.equal(htmlFiles.length, 11 * PAGES_PER_LOCALE + 1); // + 404.html
  // Her dil tam kalıbı üretmeli.
  for (const L of LOCALES) {
    const n = pages.filter((p) => p.L.lang === L.lang).length;
    assert.equal(n, PAGES_PER_LOCALE, `${L.lang}: ${n} sayfa (beklenen ${PAGES_PER_LOCALE})`);
  }
});

test("use-case `key` paritesi: tüm diller aynı 9 anahtarı aynı ikonla taşır", () => {
  const expected = en.useCases.map((u) => u.key).sort();
  assert.equal(expected.length, 9);
  const iconByKey = new Map(en.useCases.map((u) => [u.key, u.icon]));
  for (const L of LOCALES) {
    const keys = L.useCases.map((/** @type {any} */ u) => u.key).sort();
    assert.deepEqual(keys, expected, `${L.lang}: use-case key kümesi farklı`);
    for (const u of L.useCases) {
      assert.equal(u.icon, iconByKey.get(u.key), `${L.lang}/${u.key}: ikon paritesi bozuk`);
    }
  }
});

test("related slug'ları kendi dilinde mevcut (her dil)", () => {
  for (const L of LOCALES) {
    const slugs = new Set(L.useCases.map((/** @type {any} */ u) => u.slug));
    for (const u of L.useCases) {
      assert.equal(u.related.length, 3, `${L.lang}/${u.slug}: related 3 değil`);
      for (const r of u.related) {
        assert.ok(slugs.has(r), `${L.lang}/${u.slug} related '${r}' yok`);
      }
    }
  }
});

test("karşılaştırma araç slug'ları tüm dillerde aynı (cross-language eşleştirme)", () => {
  const expected = en.compare.tools.map((t) => t.slug).sort();
  for (const L of LOCALES) {
    const slugs = L.compare.tools.map((/** @type {any} */ t) => t.slug).sort();
    assert.deepEqual(slugs, expected, `${L.lang}: araç slug kümesi farklı`);
  }
});

test("hukuki metin sürümü uygulamadaki kanonik kaynakla aynı (kayma bekçisi)", () => {
  const mobile = readFileSync(
    path.join(import.meta.dirname, "../mobile/src/legal/index.ts"),
    "utf8",
  );
  for (const doc of [privacy, terms]) {
    assert.ok(
      mobile.includes(`version: "${doc.version}"`),
      `kanonik kaynakta version ${doc.version} yok — iki kopya birlikte güncellenmeli`,
    );
    assert.ok(
      mobile.includes(`updated: "${doc.updated}"`),
      `kanonik kaynakta updated ${doc.updated} yok — iki kopya birlikte güncellenmeli`,
    );
  }
});

test("iç bağlantıların tamamı üretilen bir sayfaya/dosyaya gider", () => {
  /** @type {string[]} */
  const broken = [];
  for (const file of htmlFiles) {
    const html = readFileSync(file, "utf8");
    for (const m of html.matchAll(/(?:href|src)="(\/[^"#]*)(?:#[^"]*)?"/g)) {
      const url = m[1];
      const target = url.endsWith("/") ? path.join(OUT, url, "index.html") : path.join(OUT, url);
      if (!existsSync(target)) broken.push(`${path.relative(OUT, file)} → ${url}`);
    }
  }
  assert.deepEqual(broken, []);
});

test("sayfa-içi çapa hedefleri mevcut (#how, #faq)", () => {
  for (const L of LOCALES) {
    const html = readFileSync(path.join(OUT, homeOf(L.lang)), "utf8");
    for (const anchor of html.matchAll(/href="[^"]*#([\w-]+)"/g)) {
      assert.match(html, new RegExp(`id="${anchor[1]}"`), `${homeOf(L.lang)} → #${anchor[1]}`);
    }
  }
});

test("her sayfada zorunlu SEO/GEO başlıkları: lang, title, description, canonical, tek h1, hreflang", () => {
  const langAlt = LANGS.join("|");
  for (const file of htmlFiles) {
    const html = readFileSync(file, "utf8");
    const rel = path.relative(OUT, file);
    assert.match(
      html,
      new RegExp(`<html lang="(${langAlt})" dir="(ltr|rtl)">`),
      `${rel}: lang+dir`,
    );
    assert.match(html, /<title>[^<]{10,70}<\/title>/, `${rel}: title 10-70 karakter`);
    const desc = html.match(/<meta name="description" content="([^"]*)"/);
    const descText = desc
      ? desc[1]
          .replaceAll("&quot;", '"')
          .replaceAll("&amp;", "&")
          .replaceAll("&lt;", "<")
          .replaceAll("&gt;", ">")
      : "";
    const descLen = descText.length;
    // Alt sınır betiğe duyarlı: CJK (Han/Hiragana/Katakana) kod-birimi başına ~2× bilgi
    // taşır, dolayısıyla tam bir açıklama daha az karakterdir; üst sınır (165, gerçek SERP
    // kesme noktası) tüm dillerde aynı. EN/TR (Latin) aralığı 50-165 olarak korunur.
    const cjk = /[぀-ヿ㐀-鿿豈-﫿]/.test(descText);
    const minLen = cjk ? 30 : 50;
    assert.ok(
      desc && descLen >= minLen && descLen <= 165,
      `${rel}: description ${minLen}-165 (${descLen})`,
    );
    assert.match(html, /<link rel="canonical"/, `${rel}: canonical`);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${rel}: tek h1`);
    // Her dilin hreflang'ı + x-default mevcut olmalı.
    for (const lang of LANGS) {
      assert.match(html, new RegExp(`hreflang="${lang}"`), `${rel}: hreflang ${lang}`);
    }
    assert.match(html, /hreflang="x-default"/, `${rel}: x-default`);
  }
});

test('RTL: Arapça <html dir="rtl">, LTR diller dir="ltr"', () => {
  const ar = readFileSync(path.join(OUT, "ar/index.html"), "utf8");
  assert.match(ar, /<html lang="ar" dir="rtl">/, "ar sayfası dir=rtl olmalı");
  const enHtml = readFileSync(path.join(OUT, "index.html"), "utf8");
  assert.match(enHtml, /<html lang="en" dir="ltr">/, "en sayfası dir=ltr olmalı");
});

test("dil değiştirici: her sayfa 11 dile bağlantı verir, aktif dil işaretli", () => {
  for (const L of LOCALES) {
    const html = readFileSync(path.join(OUT, homeOf(L.lang)), "utf8");
    const sw = html.match(/<nav class="ftr-lang"[\s\S]*?<\/nav>/);
    assert.ok(sw, `${L.lang}: dil değiştirici bloğu yok`);
    for (const lang of LANGS) {
      assert.match(sw[0], new RegExp(`hreflang="${lang}"`), `${L.lang} switcher: ${lang} yok`);
    }
    assert.match(sw[0], /aria-current="true"/, `${L.lang} switcher: aktif dil işareti yok`);
  }
});

test("tüm JSON-LD blokları geçerli JSON ve @context taşır", () => {
  for (const file of htmlFiles) {
    const html = readFileSync(file, "utf8");
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      const data = JSON.parse(m[1]);
      assert.equal(data["@context"], "https://schema.org", path.relative(OUT, file));
    }
  }
});

test("ana sayfalar SoftwareApplication + FAQPage şeması içerir (her dil)", () => {
  for (const L of LOCALES) {
    const html = readFileSync(path.join(OUT, homeOf(L.lang)), "utf8");
    assert.match(html, /"@type":"SoftwareApplication"/, homeOf(L.lang));
    assert.match(html, /"@type":"FAQPage"/, homeOf(L.lang));
  }
});

test("sitemap, üretilen indekslenebilir sayfalarla birebir örtüşür + 11 alternatif", () => {
  const xml = readFileSync(path.join(OUT, "sitemap.xml"), "utf8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const expected = pages.filter((p) => !p.noindex).map((p) => SITE + p.path);
  assert.deepEqual(locs.sort(), expected.sort());
  assert.ok(!xml.includes("/404"), "404 sitemap'te olmamalı");
  // Her URL bloğu 11 dil alternatifi + x-default taşımalı.
  for (const lang of LANGS) {
    assert.match(xml, new RegExp(`hreflang="${lang}"`), `sitemap: ${lang} alternatifi yok`);
  }
  assert.match(xml, /hreflang="x-default"/, "sitemap: x-default yok");
});

test("hreflang eşlenikleri N-yönlü simetrik (A'nın B alternatifi ise B'ninki A)", () => {
  const byPath = new Map(pages.map((p) => [p.path, p]));
  for (const p of pages) {
    for (const [lang, altPath] of Object.entries(p.alts)) {
      const alt = byPath.get(altPath);
      assert.ok(alt, `${p.path} → ${lang}:${altPath} üretilmemiş`);
      // Eşlenik sayfanın alts haritası geri dönüşte bu sayfanın dilini/yolunu içermeli.
      assert.equal(alt.alts[p.L.lang], p.path, `${p.path} ↔ ${altPath} (${lang}) simetrik değil`);
    }
  }
});

test("her sayfanın alts haritası 11 dili de kapsar", () => {
  for (const p of pages) {
    const altLangs = Object.keys(p.alts).sort();
    assert.deepEqual(altLangs, [...LANGS].sort(), `${p.path}: alts dilleri eksik`);
  }
});

test("robots.txt AI botlarına açık ve sitemap bildirir", () => {
  const robots = readFileSync(path.join(OUT, "robots.txt"), "utf8");
  for (const bot of [
    "GPTBot",
    "OAI-SearchBot",
    "ClaudeBot",
    "PerplexityBot",
    "Google-Extended",
    "Bingbot",
  ]) {
    assert.match(robots, new RegExp(`User-agent: ${bot}\\nAllow: /`), bot);
  }
  assert.match(robots, /Sitemap: https:\/\/example\.test\/sitemap\.xml/);
});

test("llms.txt + llms-full.txt üretilir, uygulama adresini ve 11 dil bölümünü içerir", () => {
  const llms = readFileSync(path.join(OUT, "llms.txt"), "utf8");
  assert.match(llms, /^# Whenly/);
  assert.ok(llms.includes(APP_URL), "llms.txt uygulama adresini (APP_URL) içermeli");
  for (const L of LOCALES) {
    assert.ok(llms.includes(`(${L.lang})`), `llms.txt ${L.lang} bölümünü içermeli`);
  }
  const full = readFileSync(path.join(OUT, "llms-full.txt"), "utf8");
  assert.ok(full.length > 10_000, "llms-full.txt içerik taşımalı");
});

test("statik varlıklar kopyalandı (font, css, js, favicon, IndexNow anahtarı, vercel.json)", () => {
  for (const f of [
    "fonts/inter-latin.woff2",
    "fonts/inter-latin-ext.woff2",
    "assets/site.css",
    "assets/client.js",
    "favicon.svg",
    "vercel.json",
    "404.html",
  ]) {
    assert.ok(existsSync(path.join(OUT, f)), f);
  }
  const key = walk(OUT).find((f) => /whenly[0-9a-f]+\.txt$/.test(path.basename(f)));
  assert.ok(key, "IndexNow anahtar dosyası");
});

test("EMOJİ YASAĞI: üretilen HTML'de emoji yok (ikonlar yalnız SVG)", () => {
  // © ™ gibi meşru işaretler hariç tüm piktografikler (v-flag küme çıkarması)
  const emoji = /[\p{Extended_Pictographic}--[©®™]]/v;
  for (const file of htmlFiles) {
    const html = readFileSync(file, "utf8");
    assert.ok(!emoji.test(html), `${path.relative(OUT, file)} emoji içeriyor`);
  }
});

test("erişilebilirlik değişmezleri: skip-link, main, nav etiketli, butonlar type'lı, svg'ler aria-hidden", () => {
  for (const file of htmlFiles) {
    const html = readFileSync(file, "utf8");
    const rel = path.relative(OUT, file);
    assert.match(html, /class="skip"/, `${rel}: skip-link`);
    assert.match(html, /<main id="main">/, `${rel}: main`);
    const buttons = html.match(/<button(?![^>]*type=)/g);
    assert.equal(buttons, null, `${rel}: type'sız button`);
    const svgs = [...html.matchAll(/<svg(?![^>]*aria-hidden)/g)];
    assert.equal(svgs.length, 0, `${rel}: aria-hidden'sız svg`);
  }
});
