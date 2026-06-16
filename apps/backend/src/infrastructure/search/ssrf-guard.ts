import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * SSRF koruması (ADR-156). Checker + fizibilite ajanı, kullanıcının önerdiği "resmî site"
 * alan adlarını SUNUCU-TARAFINDA çeker. Eski guard yalnız LEKSİKALDİ (DNS yok, IP-aralık yok)
 * ve `redirect:"follow"` ile bir public domain'den `302 → 169.254.169.254` (bulut metadata) /
 * `127.0.0.1` (iç servis) kaçışına açıktı; çekilen gövde kullanıcının zaman çizelgesine yazılıp
 * sızdırılıyordu. Bu modül: (1) DNS çözüp TÜM adresleri özel-aralığa karşı denetler (rebinding +
 * alternatif IP kodlaması kapanır), (2) redirect'leri ELLE takip edip her atlamada yeniden doğrular.
 */

/** Test/DI için DNS çözücü — host → IP listesi. Varsayılan: gerçek getaddrinfo. */
export type HostResolver = (host: string) => Promise<string[]>;

const defaultResolve: HostResolver = async (host) => {
  const addrs = await lookup(host, { all: true });
  return addrs.map((a) => a.address);
};

function ipv4Private(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return true;
  const o = parts.map(Number);
  if (o.some((x) => !Number.isInteger(x) || x < 0 || x > 255)) return true;
  const n = (((o[0] ?? 0) << 24) | ((o[1] ?? 0) << 16) | ((o[2] ?? 0) << 8) | (o[3] ?? 0)) >>> 0;
  const inRange = (a: number, b: number, c: number, d: number, bits: number): boolean => {
    const base = (((a << 24) | (b << 16) | (c << 8) | d) >>> 0) >>> 0;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (n & mask) >>> 0 === (base & mask) >>> 0;
  };
  return (
    inRange(0, 0, 0, 0, 8) || // "bu" ağ
    inRange(10, 0, 0, 0, 8) || // RFC1918
    inRange(100, 64, 0, 0, 10) || // CGNAT
    inRange(127, 0, 0, 0, 8) || // loopback
    inRange(169, 254, 0, 0, 16) || // link-local — BULUT METADATA (169.254.169.254)
    inRange(172, 16, 0, 0, 12) || // RFC1918
    inRange(192, 0, 0, 0, 24) || // IETF protokol tahsisi
    inRange(192, 168, 0, 0, 16) || // RFC1918
    inRange(198, 18, 0, 0, 15) || // benchmark
    inRange(224, 0, 0, 0, 4) || // multicast
    inRange(240, 0, 0, 0, 4) // reserved
  );
}

function ipv6Private(ip: string): boolean {
  const a = (ip.split("%")[0] ?? ip).toLowerCase();
  if (a === "::1" || a === "::") return true;
  if (/^fe[89ab]/.test(a)) return true; // fe80::/10 link-local
  if (/^f[cd]/.test(a)) return true; // fc00::/7 ULA
  const m = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(a);
  if (m?.[1]) return ipv4Private(m[1]);
  return false;
}

/** IP (v4/v6) özel/dahili/ayrılmış aralıkta mı? Geçersiz/bilinmeyen → güvensiz say (true). */
export function isPrivateIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) return ipv4Private(ip);
  if (v === 6) return ipv6Private(ip);
  return true;
}

/**
 * Host KAMUSAL mı? IP literal → doğrudan; alan adı → DNS çöz, TÜM adresler kamusal olmalı.
 * Çözülemezse / özel ad / geçersiz → false (çekme). Leksikal ön-red DNS'siz çalışır (localhost vb.).
 */
export async function isPublicHost(
  host: string,
  resolve: HostResolver = defaultResolve,
): Promise<boolean> {
  const h = host.toLowerCase().trim().replace(/\.$/, ""); // trailing-dot normalize
  if (!h) return false;
  if (isIP(h) !== 0) return !isPrivateIp(h);
  if (!/^[a-z0-9.-]+$/.test(h) || !h.includes(".")) return false;
  if (/(^|\.)(localhost|local|internal|lan|home|corp)$/.test(h)) return false;
  try {
    const ips = await resolve(h);
    return ips.length > 0 && ips.every((ip) => !isPrivateIp(ip));
  } catch {
    return false;
  }
}

export interface SafeFetchOpts {
  resolve?: HostResolver | undefined;
  maxRedirects?: number | undefined;
}

/**
 * SSRF-güvenli fetch: redirect'leri ELLE takip eder, HER atlamada host'u yeniden doğrular
 * (redirect ile iç-ağa/metadata kaçışı kapanır), yalnız https. Güvensiz host / çok-fazla
 * redirect / geçersiz URL → null. Çağıran timeout'u init.signal ile verir.
 */
export async function safeFetch(
  initialUrl: string,
  fetchImpl: typeof fetch,
  init: RequestInit = {},
  opts: SafeFetchOpts = {},
): Promise<Response | null> {
  const resolve = opts.resolve ?? defaultResolve;
  const maxRedirects = opts.maxRedirects ?? 3;
  let current = initialUrl;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    let u: URL;
    try {
      u = new URL(current);
    } catch {
      return null;
    }
    if (u.protocol !== "https:") return null;
    if (!(await isPublicHost(u.hostname, resolve))) return null;
    const res = await fetchImpl(current, { ...init, redirect: "manual" });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return res;
      try {
        current = new URL(loc, current).toString();
      } catch {
        return null;
      }
      continue;
    }
    return res;
  }
  return null;
}
