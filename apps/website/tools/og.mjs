// og.png üreticisi — sıfır bağımlılık (node:zlib ile PNG kodlama, elle rasterize).
// Tek seferlik çalıştırılır, çıktı public/og.png olarak commitlenir:
//   node tools/og.mjs
// Görsel dil: marka radar motifi + geometrik "Whenly" yazısı (yuvarlak uçlu kalın
// çizgi harfler) — koyu zemin (#0B1220) üzerinde marka gradyanı (#6366F1→#7C3AED).
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const W = 1200;
const H = 630;
const px = new Float64Array(W * H * 4); // RGBA 0-255 (float, AA birikimi için)

/** @param {number} x @param {number} y @param {number[]} rgb @param {number} a */
function blend(x, y, rgb, a) {
  if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return;
  const i = (y * W + x) * 4;
  const na = Math.min(1, a);
  px[i] = px[i] * (1 - na) + rgb[0] * na;
  px[i + 1] = px[i + 1] * (1 - na) + rgb[1] * na;
  px[i + 2] = px[i + 2] * (1 - na) + rgb[2] * na;
  px[i + 3] = 255;
}

/** @param {number} t */
const clamp01 = (t) => Math.max(0, Math.min(1, t));
/** @param {number[]} a @param {number[]} b @param {number} t */
const mix = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const INK = [11, 18, 32];
const INK2 = [18, 27, 48];
const GRAD_A = [99, 102, 241];
const GRAD_B = [124, 58, 237];
const TEXT = [241, 245, 249];
const MUTED = [168, 182, 201];
const POS = [74, 222, 128];

// Zemin: çapraz gradyan + sol-orta hafif indigo parıltısı
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const t = clamp01((x / W + y / H) / 2);
    let c = mix(INK, INK2, t);
    const dx = (x - 330) / 700;
    const dy = (y - 300) / 500;
    const glow = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
    c = mix(c, GRAD_A, glow * glow * 0.16);
    blend(x, y, c, 1);
  }
}

/** Nokta-doğru parçası uzaklığı. */
function segDist(
  /** @type {number} */ px_,
  /** @type {number} */ py,
  /** @type {number} */ ax,
  /** @type {number} */ ay,
  /** @type {number} */ bx,
  /** @type {number} */ by,
) {
  const abx = bx - ax;
  const aby = by - ay;
  const len2 = abx * abx + aby * aby || 1;
  const t = clamp01(((px_ - ax) * abx + (py - ay) * aby) / len2);
  const cx = ax + abx * t;
  const cy = ay + aby * t;
  return Math.hypot(px_ - cx, py - cy);
}

/** Kalın, yuvarlak uçlu çoklu-çizgi (polyline) raster. @param {number[][]} pts @param {number} w @param {number[]} rgb @param {number} [alpha] */
function stroke(pts, w, rgb, alpha = 1) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const [x, y] of pts) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const r = w / 2;
  const x0 = Math.floor(minX - r - 2);
  const x1 = Math.ceil(maxX + r + 2);
  const y0 = Math.floor(minY - r - 2);
  const y1 = Math.ceil(maxY + r + 2);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      let d = Number.POSITIVE_INFINITY;
      for (let i = 0; i < pts.length - 1; i++) {
        d = Math.min(
          d,
          segDist(x + 0.5, y + 0.5, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]),
        );
        if (d <= r - 1) break;
      }
      const a = clamp01(r - d + 0.5); // 1px AA
      if (a > 0) blend(x, y, rgb, a * alpha);
    }
  }
}

/** Çember yayı → polyline örnekleme. @param {number} cx @param {number} cy @param {number} r @param {number} a0 derece @param {number} a1 derece */
function arcPts(cx, cy, r, a0, a1, steps = 48) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const a = ((a0 + ((a1 - a0) * i) / steps) * Math.PI) / 180;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

/** Kuadratik Bézier → polyline örnekleme. */
function quadPts(
  /** @type {number[]} */ p0,
  /** @type {number[]} */ c,
  /** @type {number[]} */ p1,
  steps = 24,
) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    out.push([
      u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0],
      u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1],
    ]);
  }
  return out;
}

// ---- Sağ taraf: radar motifi (marka işareti büyütülmüş) ----
const RC = [880, 315];
for (const [r, a] of [
  [250, 0.14],
  [190, 0.22],
  [130, 0.34],
]) {
  const ring = arcPts(RC[0], RC[1], /** @type {number} */ (r), 0, 360, 120);
  const t = /** @type {number} */ (r - 130) / 120;
  stroke(ring, 3, mix(GRAD_A, GRAD_B, t), /** @type {number} */ (a));
}
// Açılı parlak yaylar (brandMark'taki gibi)
stroke(arcPts(RC[0], RC[1], 190, -90, 0, 60), 9, mix(GRAD_A, GRAD_B, 0.4), 0.95);
stroke(arcPts(RC[0], RC[1], 130, -90, -20, 40), 9, mix(GRAD_A, GRAD_B, 0.75), 0.95);
// Merkez nokta + parıltı
for (let rr = 26; rr >= 1; rr--) {
  const ring = arcPts(RC[0], RC[1], rr, 0, 360, 64);
  stroke(ring, 2.5, mix(GRAD_A, GRAD_B, 0.5), rr <= 12 ? 1 : 0.05);
}
// Tespit "ping" noktası (yeşil) — halka üzerinde
stroke(arcPts(RC[0] + 134, RC[1] - 134, 7, 0, 360, 32), 7, POS, 1);
stroke(arcPts(RC[0] + 134, RC[1] - 134, 16, 0, 360, 48), 2.5, POS, 0.35);

// ---- Sol taraf: "Whenly" geometrik yazı ----
// Harfler birim ızgarada (taban çizgisi y=100, x-yüksekliği 30, çıkıcı -8, inici 138)
/** @type {Record<string, { adv: number, strokes: number[][][] }>} */
const GLYPHS = {
  W: {
    adv: 112,
    strokes: [
      [
        [0, 0],
        [26, 100],
        [48, 26],
        [70, 100],
        [96, 0],
      ],
    ],
  },
  h: {
    adv: 60,
    strokes: [
      [
        [0, -8],
        [0, 100],
      ],
      [...quadPts([0, 64], [0, 30], [22, 30]), ...quadPts([22, 30], [44, 30], [44, 64]), [44, 100]],
    ],
  },
  e: {
    adv: 62,
    strokes: [
      [
        [6, 62],
        [40, 62],
      ],
      // üst-sağdan saat yönünün tersine, alt-sağda açık biten halka
      arcPts(23, 65, 22, -8, -262, 64),
    ],
  },
  n: {
    adv: 60,
    strokes: [
      [
        [0, 30],
        [0, 100],
      ],
      [...quadPts([0, 64], [0, 30], [22, 30]), ...quadPts([22, 30], [44, 30], [44, 64]), [44, 100]],
    ],
  },
  l: {
    adv: 18,
    strokes: [
      [
        [0, -8],
        [0, 100],
      ],
    ],
  },
  y: {
    adv: 58,
    strokes: [
      [
        [0, 30],
        [22, 86],
      ],
      [
        [44, 30],
        [10, 138],
      ],
    ],
  },
};

const SCALE = 1.62;
const SW = 19; // kontur kalınlığı (px)
let cursorX = 92;
const baseY = 322;
for (const ch of "Whenly") {
  const g = GLYPHS[ch];
  for (const s of g.strokes) {
    stroke(
      s.map(([x, y]) => [cursorX + x * SCALE, baseY + y * SCALE]),
      SW,
      TEXT,
    );
  }
  cursorX += g.adv * SCALE;
}

// Alt vurgu çizgisi — gradyan (slogan yerine sözsüz marka imzası)
const lineY = Math.round(baseY + 138 * SCALE + 26);
for (let x = 92; x <= 92 + 380; x++) {
  const t = (x - 92) / 380;
  blend(x, lineY, mix(GRAD_A, GRAD_B, t), 1);
  blend(x, lineY + 1, mix(GRAD_A, GRAD_B, t), 1);
  blend(x, lineY + 2, mix(GRAD_A, GRAD_B, t), 1);
  blend(x, lineY + 3, mix(GRAD_A, GRAD_B, t), 0.5);
}
// Çizgi ucunda nokta
stroke(arcPts(92 + 404, lineY + 1.5, 6, 0, 360, 32), 6, GRAD_B, 1);

// ---- PNG kodlama ----
const raw = Buffer.alloc(H * (W * 3 + 1));
for (let y = 0; y < H; y++) {
  raw[y * (W * 3 + 1)] = 0; // filtre: none
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const o = y * (W * 3 + 1) + 1 + x * 3;
    raw[o] = Math.round(px[i]);
    raw[o + 1] = Math.round(px[i + 1]);
    raw[o + 2] = Math.round(px[i + 2]);
  }
}

const CRC_TABLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
/** @param {Buffer} buf */
function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
/** @param {string} type @param {Buffer} data */
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit derinliği
ihdr[9] = 2; // renk tipi: truecolor
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "../public/og.png");
writeFileSync(out, png);
console.log(`✓ og.png yazıldı (${Math.round(png.length / 1024)} KB) → ${out}`);
