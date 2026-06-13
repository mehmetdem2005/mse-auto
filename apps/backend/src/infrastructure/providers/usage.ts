/**
 * Sağlayıcı kullanım panosu (ADR-095) — her kart sağlayıcının KENDİ API'sinden
 * canlı çekilir. İlkeler:
 *  - Token env'de yoksa: configured=false + hangi env'in eksik olduğu yazılır.
 *  - Uç hata verirse: ok=false + gerçek hata; uydurma metrik YOK.
 *  - Sağlayıcı kullanım API'si sunmuyorsa (Groq) bu açıkça söylenir.
 * Tüm istekler 6 sn zaman aşımlı; kartlar paralel çekilir (allSettled).
 */
import type { ProviderMetric, ProviderUsage } from "@watcher/contracts";
import type { ProviderUsagePort } from "../../domain/providers";

export interface ProviderTokens {
  deepseekKey?: string | undefined;
  groqKey?: string | undefined;
  /** Supabase Management API kişisel erişim token'ı (sbp_…). */
  supabaseAccessToken?: string | undefined;
  /** Proje ref'i SUPABASE_URL'den türetilir. */
  supabaseUrl?: string | undefined;
  renderApiKey?: string | undefined;
  vercelToken?: string | undefined;
  vercelTeamId?: string | undefined;
}

const TIMEOUT_MS = 6_000;

async function getWithTimeout(
  fetchImpl: typeof fetch,
  url: string,
  headers: Record<string, string>,
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetchImpl(url, { headers, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.name === "AbortError" ? "zaman aşımı (6 sn)" : e.message;
  return String(e);
}

const usd = (n: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export class HttpProviderUsageService implements ProviderUsagePort {
  constructor(
    private readonly tokens: ProviderTokens,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async fetchAll(): Promise<ProviderUsage[]> {
    const order = [
      { id: "deepseek", name: "DeepSeek", run: () => this.deepseek() },
      { id: "groq", name: "Groq", run: () => this.groq() },
      { id: "supabase", name: "Supabase", run: () => this.supabase() },
      { id: "render", name: "Render", run: () => this.render() },
      { id: "vercel", name: "Vercel", run: () => this.vercel() },
    ] as const;
    const cards = await Promise.allSettled(order.map((o) => o.run()));
    // allSettled: tek kartın beklenmeyen hatası panoyu düşürmez.
    return cards.map((c, i) => {
      const meta = order[i] as (typeof order)[number];
      return c.status === "fulfilled"
        ? c.value
        : this.card(meta.id, meta.name, "", { configured: true, error: errMsg(c.reason) });
    });
  }

  private card(
    id: ProviderUsage["id"],
    name: string,
    consoleUrl: string,
    partial: Partial<ProviderUsage>,
  ): ProviderUsage {
    return {
      id,
      name,
      configured: false,
      ok: false,
      metrics: [],
      error: null,
      consoleUrl,
      fetchedAt: new Date().toISOString(),
      ...partial,
    };
  }

  /** Gerçek bakiye: GET /user/balance (anahtarın kendisiyle, ek token gerekmez). */
  private async deepseek(): Promise<ProviderUsage> {
    const base = this.card("deepseek", "DeepSeek", "https://platform.deepseek.com/usage", {});
    if (!this.tokens.deepseekKey) return { ...base, error: "DEEPSEEK_API_KEY tanımlı değil" };
    try {
      const res = await getWithTimeout(this.fetchImpl, "https://api.deepseek.com/user/balance", {
        Authorization: `Bearer ${this.tokens.deepseekKey}`,
      });
      if (!res.ok) return { ...base, configured: true, error: `deepseek ${res.status}` };
      const data = (await res.json()) as {
        is_available?: boolean;
        balance_infos?: Array<{
          currency?: string;
          total_balance?: string;
          granted_balance?: string;
          topped_up_balance?: string;
        }>;
      };
      const b = data.balance_infos?.[0];
      const metrics: ProviderMetric[] = [
        {
          label: "Kalan bakiye",
          value: b ? `${b.total_balance ?? "?"} ${b.currency ?? ""}`.trim() : "okunamadı",
          limit: null,
        },
        ...(b?.topped_up_balance
          ? [
              {
                label: "Yüklenen",
                value: `${b.topped_up_balance} ${b.currency ?? ""}`,
                limit: null,
              },
            ]
          : []),
        ...(b?.granted_balance && Number(b.granted_balance) > 0
          ? [{ label: "Hibe", value: `${b.granted_balance} ${b.currency ?? ""}`, limit: null }]
          : []),
        {
          label: "Hesap durumu",
          value: data.is_available ? "kullanılabilir" : "bakiye bitti",
          limit: null,
        },
      ];
      return { ...base, configured: true, ok: true, metrics };
    } catch (e) {
      return { ...base, configured: true, error: errMsg(e) };
    }
  }

  /** Groq herkese açık kullanım API'si sunmuyor — dürüstçe söylenir, konsola yönlendirilir. */
  private async groq(): Promise<ProviderUsage> {
    const base = this.card("groq", "Groq", "https://console.groq.com/settings/billing", {});
    if (!this.tokens.groqKey) return { ...base, error: "GROQ_API_KEY tanımlı değil" };
    return {
      ...base,
      configured: true,
      ok: true,
      metrics: [
        { label: "Anahtar", value: "tanımlı", limit: null },
        { label: "Kullanım API'si", value: "Groq sunmuyor — konsoldan izlenir", limit: null },
      ],
    };
  }

  /** Supabase Management API: proje durumu + (varsa) API istek sayacı. */
  private async supabase(): Promise<ProviderUsage> {
    const ref = this.tokens.supabaseUrl
      ? new URL(this.tokens.supabaseUrl).hostname.split(".")[0]
      : null;
    const base = this.card(
      "supabase",
      "Supabase",
      ref ? `https://supabase.com/dashboard/project/${ref}` : "https://supabase.com/dashboard",
      {},
    );
    if (!this.tokens.supabaseAccessToken)
      return { ...base, error: "SUPABASE_ACCESS_TOKEN tanımlı değil" };
    if (!ref) return { ...base, error: "SUPABASE_URL tanımlı değil (proje ref'i çıkarılamadı)" };
    const headers = { Authorization: `Bearer ${this.tokens.supabaseAccessToken}` };
    try {
      const res = await getWithTimeout(
        this.fetchImpl,
        `https://api.supabase.com/v1/projects/${ref}`,
        headers,
      );
      if (!res.ok) return { ...base, configured: true, error: `supabase ${res.status}` };
      const p = (await res.json()) as { status?: string; region?: string; name?: string };
      const metrics: ProviderMetric[] = [
        { label: "Proje", value: p.name ?? ref, limit: null },
        { label: "Durum", value: p.status ?? "?", limit: null },
        { label: "Bölge", value: p.region ?? "?", limit: null },
      ];
      // Ayrıntılı kota uçları plana göre değişiyor; başarısızlık kartı düşürmez.
      try {
        const u = await getWithTimeout(
          this.fetchImpl,
          `https://api.supabase.com/v1/projects/${ref}/database/size`,
          headers,
        );
        if (u.ok) {
          const s = (await u.json()) as { size_bytes?: number };
          if (typeof s.size_bytes === "number")
            metrics.push({
              label: "Veritabanı boyutu",
              value: `${(s.size_bytes / 1024 / 1024).toFixed(1)} MB`,
              limit: "/ 500 MB (free)",
            });
        }
      } catch {
        /* opsiyonel metrik — sessiz geç */
      }
      return { ...base, configured: true, ok: true, metrics };
    } catch (e) {
      return { ...base, configured: true, error: errMsg(e) };
    }
  }

  /** Render: servis listesi + (varsa) bant genişliği metriği. */
  private async render(): Promise<ProviderUsage> {
    const base = this.card("render", "Render", "https://dashboard.render.com", {});
    if (!this.tokens.renderApiKey) return { ...base, error: "RENDER_API_KEY tanımlı değil" };
    const headers = {
      Authorization: `Bearer ${this.tokens.renderApiKey}`,
      Accept: "application/json",
    };
    try {
      const res = await getWithTimeout(
        this.fetchImpl,
        "https://api.render.com/v1/services?limit=20",
        headers,
      );
      if (!res.ok) return { ...base, configured: true, error: `render ${res.status}` };
      const rows = (await res.json()) as Array<{
        service?: { id?: string; name?: string; suspended?: string; type?: string };
      }>;
      const metrics: ProviderMetric[] = rows
        .map((r) => r.service)
        .filter((s): s is NonNullable<typeof s> => !!s)
        .map((s) => ({
          label: `${s.name ?? s.id} (${s.type ?? "servis"})`,
          value: s.suspended === "suspended" ? "askıda" : "çalışıyor",
          limit: null,
        }));
      // Bant genişliği ucu hesap planına göre kapalı olabilir — opsiyonel.
      try {
        const ids = rows
          .map((r) => r.service?.id)
          .filter((x): x is string => !!x)
          .slice(0, 5);
        if (ids.length > 0) {
          const bw = await getWithTimeout(
            this.fetchImpl,
            `https://api.render.com/v1/metrics/bandwidth?resourceIds=${ids.join(",")}`,
            headers,
          );
          if (bw.ok) {
            const series = (await bw.json()) as Array<{
              values?: Array<{ value?: number }>;
            }>;
            const total = series
              .flatMap((s) => s.values ?? [])
              .reduce((a, v) => a + (v.value ?? 0), 0);
            if (total > 0)
              metrics.push({
                label: "Bant genişliği (dönem)",
                value: `${(total / 1024 / 1024 / 1024).toFixed(2)} GB`,
                limit: "/ 100 GB (free)",
              });
          }
        }
      } catch {
        /* opsiyonel metrik — sessiz geç */
      }
      return { ...base, configured: true, ok: true, metrics };
    } catch (e) {
      return { ...base, configured: true, error: errMsg(e) };
    }
  }

  /** Vercel: faturalama/kullanım (FOCUS JSONL) — takım kapsamı yoksa proje sayısına düşer. */
  private async vercel(): Promise<ProviderUsage> {
    const base = this.card("vercel", "Vercel", "https://vercel.com/dashboard/usage", {});
    if (!this.tokens.vercelToken) return { ...base, error: "VERCEL_TOKEN tanımlı değil" };
    const headers = { Authorization: `Bearer ${this.tokens.vercelToken}` };
    const team = this.tokens.vercelTeamId ? `?teamId=${this.tokens.vercelTeamId}` : "";
    try {
      const res = await getWithTimeout(
        this.fetchImpl,
        `https://api.vercel.com/v1/billing/charges${team}`,
        headers,
      );
      if (res.ok) {
        const text = await res.text();
        let total = 0;
        const byService = new Map<string, number>();
        for (const line of text.split("\n").slice(0, 5000)) {
          if (!line.trim()) continue;
          try {
            const row = JSON.parse(line) as { BilledCost?: number; ServiceName?: string };
            const cost = Number(row.BilledCost ?? 0);
            total += cost;
            const svc = row.ServiceName ?? "diğer";
            byService.set(svc, (byService.get(svc) ?? 0) + cost);
          } catch {
            /* bozuk satırı atla */
          }
        }
        const top = [...byService.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
        return {
          ...base,
          configured: true,
          ok: true,
          metrics: [
            { label: "Dönem maliyeti", value: usd(total), limit: null },
            ...top.map(([svc, cost]) => ({ label: svc, value: usd(cost), limit: null })),
          ],
        };
      }
      // Faturalama ucu kişisel hesapta kapalı olabilir → proje sayısı (gerçek veri) ile düş.
      const pr = await getWithTimeout(
        this.fetchImpl,
        `https://api.vercel.com/v9/projects?limit=20${team ? `&teamId=${this.tokens.vercelTeamId}` : ""}`,
        headers,
      );
      if (!pr.ok) return { ...base, configured: true, error: `vercel ${res.status}/${pr.status}` };
      const pdata = (await pr.json()) as { projects?: Array<{ name?: string }> };
      return {
        ...base,
        configured: true,
        ok: true,
        metrics: [
          { label: "Projeler", value: String(pdata.projects?.length ?? 0), limit: null },
          {
            label: "Faturalama API'si",
            value: `erişilemedi (${res.status}) — takım kapsamı gerekebilir`,
            limit: null,
          },
        ],
      };
    } catch (e) {
      return { ...base, configured: true, error: errMsg(e) };
    }
  }
}
