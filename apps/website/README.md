# Whenly Tanıtım Sitesi (`@watcher/website`)

Sıfır-bağımlılıklı statik site üreticisi (SSG). **Neden framework yok:** AI crawler'lar
(GPTBot/ClaudeBot/PerplexityBot) JavaScript çalıştırmaz — tanıtım içeriği ilk HTML'de
olmak zorunda; üretici ~300 satır node ve tek başına bunu sağlıyor. Strateji ve kanıt
tabanı: **`docs/GEO-pazarlama-mimarisi.md`** (kanonik) · mimari karar: ADR-090.

## Komutlar

    node build.mjs            # dist/ üret (36 sayfa + sitemap/robots/llms/og)
    node build.mjs --serve    # üret + http://localhost:4321 önizleme
    pnpm typecheck            # tsc checkJs (JSDoc tipleri)
    pnpm test                 # node:test — link/SEO/a11y/emoji değişmezleri
    node tools/og.mjs         # og.png'yi yeniden üret (tek seferlik; çıktı commitlenir)
    node tools/indexnow.mjs   # IndexNow ping (deploy workflow'u otomatik çağırır)

`SITE_URL` env'i kanonik adresi değiştirir (varsayılan `https://whenly-site.vercel.app`;
özel alan adı alınınca CI Variable olarak ayarlanır — DEPLOY.md §5).

## Yapı

- `src/content.tr.mjs` + `src/content.en.mjs` — **TEK içerik kaynağı** (sayfa metinleri,
  use-case verileri, SSS). HTML + sitemap + llms.txt + JSON-LD hep buradan türetilir.
- `src/legal.mjs` — uygulamadaki kanonik hukuki metinlerin kopyası
  (`apps/mobile/src/legal/index.ts` ile birlikte güncellenir).
- `src/render.mjs` — şablonlar (atomic: ikon/buton → kart/maket → bölüm → sayfa).
- `src/site.mjs` — site sabitleri + lucide-stili inline SVG ikonlar (emoji yasak).
- `src/styles.css` — ITCSS düzeni; token'lar mobil temayla birebir; reduce-motion'lı.
- `build.mjs` — sayfa modeli + üretim; `test.mjs` — yapı değişmezleri.

## Yeni use-case sayfası eklemek

1. `content.tr.mjs` → `useCases`'e nesne ekle (slug/icon/metaTitle/metaDescription/h1/
   answer/context/examples/faq/related). `content.en.mjs`'e eşleniğini ekle.
2. `build.mjs` → `SLUG_MAP`'e TR↔EN slug çiftini ekle (test simetriyi zorlar).
3. Yazım kuralları (GEO + kullanıcı yönergesi): ilk paragraf 40-60 kelimelik bağımsız
   cevap · H2'ler soru biçiminde · NE yaptığını anlat, NASIL'ı açma (yalnız "belirli
   aralıklarla tarar") · iç mekanik/strateji yazma · **yalnız gerçekten erişilebilir
   (giriş/şifre/captcha'sız) senaryo** ekle · uydurma istatistik yok · kıtlık/aciliyet
   dili yok · vermediğimiz garanti yazılmaz · sayfa <1000 kelime.
4. `node --test test.mjs` — kırık link/uzunluk/simetri/ikon-parite testleri geçmeli.
