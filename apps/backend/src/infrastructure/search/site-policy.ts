import type { SitePolicyResolver, SitePolicyVerdict } from "../../domain/site-policy";
import { buildFetchUrl } from "./origin";
import { type HostResolver, isPublicHost, safeFetch } from "./ssrf-guard";

const TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 saat — site politikası nadiren değişir.
const MAX_ROBOTS_CHARS = 20_000;

/**
 * robots.txt'i ayrıştırır: bizi kapsayan grupta (`whenlybot` önce, yoksa `*`) `Disallow: /` TAM-blok
 * var mı (ve onu gevşeten `Allow: /` yok mu)? Basit ama tam-blok tespitine yeterli (ADR-128).
 */
export function isFullyDisallowed(robots: string): boolean {
  const lines = robots
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*/, "").trim())
    .filter(Boolean);
  interface Group {
    agents: string[];
    disallows: string[];
    allows: string[];
  }
  const groups: Group[] = [];
  let cur: Group | null = null;
  let lastWasAgent = false;
  for (const line of lines) {
    const ua = /^user-agent:\s*(.*)$/i.exec(line);
    if (ua) {
      // Ardışık user-agent satırları aynı grubu paylaşır; kuraldan sonra gelen UA yeni grup açar.
      if (!cur || !lastWasAgent) {
        cur = { agents: [], disallows: [], allows: [] };
        groups.push(cur);
      }
      cur.agents.push((ua[1] ?? "").toLowerCase().trim());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!cur) continue;
    const dis = /^disallow:\s*(.*)$/i.exec(line);
    if (dis) {
      cur.disallows.push((dis[1] ?? "").trim());
      continue;
    }
    const allow = /^allow:\s*(.*)$/i.exec(line);
    if (allow) cur.allows.push((allow[1] ?? "").trim());
  }
  const pick = (name: string) => groups.find((g) => g.agents.includes(name));
  const group = pick("whenlybot") ?? pick("*");
  if (!group) return false; // bizi kapsayan kural yok → kısıt yok.
  return group.disallows.includes("/") && !group.allows.includes("/");
}

/**
 * robots.txt tabanlı site-politikası çözücü (ADR-128). `Disallow: /` TAM-blok → otomatik izleme
 * serbest DEĞİL; robots yoksa/erişilemezse serbest varsayılır (robots bir KISIT sinyalidir, izin
 * değil). Domain-başına 24s bellek cache (migration YOK). DÜRÜST: robots advisory; ToS ayrı.
 */
export class RobotsSitePolicyResolver implements SitePolicyResolver {
  private readonly cache = new Map<string, { verdict: SitePolicyVerdict; expiresAt: number }>();

  constructor(
    private readonly renderTemplate?: string | null,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly resolve?: HostResolver,
  ) {}

  async check(domain: string): Promise<SitePolicyVerdict> {
    const d = domain.toLowerCase().trim();
    const cached = this.cache.get(d);
    if (cached && cached.expiresAt > Date.now()) return cached.verdict;
    const verdict = await this.compute(d);
    this.cache.set(d, { verdict, expiresAt: Date.now() + CACHE_TTL_MS });
    return verdict;
  }

  private async compute(domain: string): Promise<SitePolicyVerdict> {
    // ADR-156: DNS-çözümlü SSRF guard (özel/iç IP + rebinding kapanır).
    if (!(await isPublicHost(domain, this.resolve))) {
      return {
        domain,
        allowed: false,
        reason: "Geçersiz/özel alan adı (kamusal değil).",
        source: "error",
      };
    }
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(
        () => ctrl.abort(),
        this.renderTemplate ? TIMEOUT_MS * 2 : TIMEOUT_MS,
      );
      const url = buildFetchUrl(`https://${domain}/robots.txt`, this.renderTemplate);
      // ADR-156: SSRF-güvenli fetch — redirect'ler elle doğrulanır.
      const res = await safeFetch(
        url,
        this.fetchImpl,
        { signal: ctrl.signal, headers: { "User-Agent": "WhenlyBot/1.0 (+monitoring)" } },
        { resolve: this.resolve },
      );
      clearTimeout(timer);
      if (!res) {
        return {
          domain,
          allowed: true,
          reason: "robots.txt okunamadı (güvenlik/ağ).",
          source: "error",
        };
      }
      if (res.status === 404) {
        return {
          domain,
          allowed: true,
          reason: "robots.txt yok — kısıt belirtilmemiş.",
          source: "none",
        };
      }
      if (!res.ok) {
        return {
          domain,
          allowed: true,
          reason: `robots.txt alınamadı (HTTP ${res.status}).`,
          source: "error",
        };
      }
      const body = (await res.text()).slice(0, MAX_ROBOTS_CHARS);
      return isFullyDisallowed(body)
        ? {
            domain,
            allowed: false,
            reason: "robots.txt tüm botlara `Disallow: /` diyor.",
            source: "robots",
          }
        : {
            domain,
            allowed: true,
            reason: "robots.txt otomatik erişimi tam engellemiyor.",
            source: "robots",
          };
    } catch {
      // ağ/timeout → belirsiz; izleme engellenmez ama dürüstçe işaretlenir.
      return {
        domain,
        allowed: true,
        reason: "robots.txt okunamadı (ağ/zaman aşımı).",
        source: "error",
      };
    }
  }
}
