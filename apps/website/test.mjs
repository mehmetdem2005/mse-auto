// Build doğrulama testleri (node:test, sıfır bağımlılık) — site her üretimde şu
// değişmezleri korur: kırık iç bağlantı yok, her sayfada SEO/GEO başlıkları tam,
// hreflang simetrik, sitemap birebir, robots/llms dosyaları yerinde, emoji yasağı.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { SLUG_MAP, buildSite, pageModel } from "./build.mjs";
import { en } from "./src/content.en.mjs";
import { tr } from "./src/content.tr.mjs";
import { privacy, terms } from "./src/legal.mjs";
import { APP_URL } from "./src/site.mjs";

const SITE = "https://example.test";
const OUT = path.join(tmpdir(), `whenly-site-test-${process.pid}`);
const result = buildSite({ outDir: OUT, siteUrl: SITE });
const pages = pageModel(SITE);

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}
const htmlFiles = walk(OUT).filter((f) => f.endsWith(".html"));

test("her sayfa üretildi (TR+EN: 2 ana + 2 dizin + 18 çözüm + 2 karşılaştırma + 2 hakkında + 4 hukuki)", () => {
  assert.equal(result.pageCount, 30);
  assert.equal(htmlFiles.length, 31); // + 404.html
});

test("TR↔EN çözüm eşleniği tam ve simetrik", () => {
  const trSlugs = tr.useCases.map((u) => u.slug).sort();
  const enSlugs = en.useCases.map((u) => u.slug).sort();
  assert.deepEqual(Object.keys(SLUG_MAP).sort(), trSlugs);
  assert.deepEqual(Object.values(SLUG_MAP).sort(), enSlugs);
});

test("related slug'ları aynı dilde mevcut; TR↔EN eşlenikleri aynı ikonu taşır", () => {
  for (const L of [tr, en]) {
    const slugs = new Set(L.useCases.map((u) => u.slug));
    for (const u of L.useCases) {
      for (const r of u.related) {
        assert.ok(slugs.has(r), `${L.lang}/${u.slug} related '${r}' yok`);
      }
    }
  }
  const enBySlug = new Map(en.useCases.map((u) => [u.slug, u]));
  for (const u of tr.useCases) {
    const pair = enBySlug.get(SLUG_MAP[/** @type {keyof typeof SLUG_MAP} */ (u.slug)]);
    assert.ok(pair, `${u.slug} EN eşleniği yok`);
    assert.equal(pair.icon, u.icon, `${u.slug} ikon paritesi bozuk`);
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
  for (const home of ["index.html", "tr/index.html"]) {
    const html = readFileSync(path.join(OUT, home), "utf8");
    for (const anchor of html.matchAll(/href="[^"]*#([\w-]+)"/g)) {
      assert.match(html, new RegExp(`id="${anchor[1]}"`), `${home} → #${anchor[1]}`);
    }
  }
});

test("her sayfada zorunlu SEO/GEO başlıkları: lang, title, description, canonical, tek h1, hreflang", () => {
  for (const file of htmlFiles) {
    const html = readFileSync(file, "utf8");
    const rel = path.relative(OUT, file);
    assert.match(html, /<html lang="(tr|en)">/, `${rel}: lang`);
    assert.match(html, /<title>[^<]{10,70}<\/title>/, `${rel}: title 10-70 karakter`);
    const desc = html.match(/<meta name="description" content="([^"]*)"/);
    const descLen = desc
      ? desc[1]
          .replaceAll("&quot;", '"')
          .replaceAll("&amp;", "&")
          .replaceAll("&lt;", "<")
          .replaceAll("&gt;", ">").length
      : 0;
    assert.ok(desc && descLen >= 50 && descLen <= 165, `${rel}: description 50-165 (${descLen})`);
    assert.match(html, /<link rel="canonical"/, `${rel}: canonical`);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${rel}: tek h1`);
    assert.match(html, /hreflang="tr"/, `${rel}: hreflang tr`);
    assert.match(html, /hreflang="en"/, `${rel}: hreflang en`);
    assert.match(html, /hreflang="x-default"/, `${rel}: x-default`);
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

test("ana sayfalar SoftwareApplication + FAQPage şeması içerir", () => {
  for (const home of ["index.html", "tr/index.html"]) {
    const html = readFileSync(path.join(OUT, home), "utf8");
    assert.match(html, /"@type":"SoftwareApplication"/, home);
    assert.match(html, /"@type":"FAQPage"/, home);
  }
});

test("sitemap, üretilen indekslenebilir sayfalarla birebir örtüşür", () => {
  const xml = readFileSync(path.join(OUT, "sitemap.xml"), "utf8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const expected = pages.filter((p) => !p.noindex).map((p) => SITE + p.path);
  assert.deepEqual(locs.sort(), expected.sort());
  assert.ok(!xml.includes("/404"), "404 sitemap'te olmamalı");
});

test("hreflang eşlenikleri simetrik (A'nın alternatifi B ise B'ninki A)", () => {
  const byPath = new Map(pages.map((p) => [p.path, p]));
  for (const p of pages) {
    const alt = byPath.get(p.altPath);
    assert.ok(alt, `${p.path} alternatifi üretilmemiş: ${p.altPath}`);
    assert.equal(alt.altPath, p.path, `${p.path} ↔ ${p.altPath} simetrik değil`);
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

test("llms.txt + llms-full.txt üretilir ve uygulama adresini içerir", () => {
  const llms = readFileSync(path.join(OUT, "llms.txt"), "utf8");
  assert.match(llms, /^# Whenly/);
  assert.ok(llms.includes(APP_URL), "llms.txt uygulama adresini (APP_URL) içermeli");
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
