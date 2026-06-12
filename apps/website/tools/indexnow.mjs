// IndexNow ping'i — Bing dizinine (ChatGPT aramasının kaynağı) güncellenen URL'leri
// bildirir. Deploy workflow'undan çağrılır: `node tools/indexnow.mjs`.
// Anahtar/site adresi/sayfa listesi build ile AYNI tek kaynaktan gelir (site.mjs +
// pageModel) — bash'te ls/grep/sed ile yeniden türetme yok (inceleme bulgusu C-011).
import { pageModel } from "../build.mjs";
import { INDEXNOW_KEY, SITE_URL } from "../src/site.mjs";

const host = new URL(SITE_URL).host;
const urlList = pageModel(SITE_URL)
  .filter((p) => !p.noindex)
  .map((p) => SITE_URL + p.path)
  .slice(0, 10_000);

const res = await fetch("https://api.indexnow.org/IndexNow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList,
  }),
});

console.log(`IndexNow → HTTP ${res.status} (${urlList.length} URL, host=${host})`);
if (!res.ok && res.status !== 202) {
  console.error(await res.text().catch(() => ""));
  process.exitCode = 1;
}
