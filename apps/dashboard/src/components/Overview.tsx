import type { Plans, Subscription } from "@watcher/contracts";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { money, shortDate } from "../lib/format";
import { Banner, Panel } from "./ui";

export function Overview({ token }: { token: string }): ReactNode {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plans | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [s, p] = await Promise.all([api.subscription(token), api.plans(token)]);
      setSub(s);
      setPlans(p);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "yüklenemedi");
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(fn: () => Promise<Subscription>): Promise<void> {
    setBusy(true);
    setErr(null);
    try {
      setSub(await fn());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "işlem başarısız");
    }
    setBusy(false);
  }

  const detail = sub?.subscription ?? null;
  const usagePct = sub
    ? Math.min(100, Math.round((sub.usage.activeWatches / sub.limits.maxActiveWatches) * 100))
    : 0;

  return (
    <>
      <h1 className="page-title">Aboneliğin</h1>
      <p className="page-sub">plan · kullanım · faturalama</p>
      {err ? <Banner kind="err">{err}</Banner> : null}

      <div className="grid cols-2">
        <Panel title="mevcut plan">
          {sub ? (
            <>
              <div className={`plan-name ${sub.plan}`}>{sub.plan}</div>
              <div className="row">
                <span className="k">aktif watcher</span>
                <span className="v">
                  {sub.usage.activeWatches} / {sub.limits.maxActiveWatches}
                </span>
              </div>
              <div className="bar">
                <i style={{ width: `${usagePct}%` }} />
              </div>
              <div className="row">
                <span className="k">min. kontrol sıklığı</span>
                <span className="v">{sub.limits.minFrequencyMinutes} dk</span>
              </div>
            </>
          ) : (
            <div className="muted">yükleniyor…</div>
          )}
        </Panel>

        <Panel title="faturalama" delay={60}>
          {detail ? (
            <>
              <div className="row">
                <span className="k">dönem</span>
                <span className="v">{detail.interval === "month" ? "aylık" : "yıllık"}</span>
              </div>
              <div className="row">
                <span className="k">tutar</span>
                <span className="v">{money(detail.amountCents, detail.currency)}</span>
              </div>
              <div className="row">
                <span className="k">durum</span>
                <span className="v">
                  {detail.status === "active"
                    ? detail.cancelAtPeriodEnd
                      ? "dönem sonunda iptal"
                      : "aktif"
                    : "iptal"}
                </span>
              </div>
              <div className="row">
                <span className="k">yenilenme</span>
                <span className="v">{shortDate(detail.currentPeriodEnd)}</span>
              </div>
              {detail.status === "active" && !detail.cancelAtPeriodEnd ? (
                <button
                  className="btn danger sm"
                  type="button"
                  disabled={busy}
                  style={{ marginTop: 14 }}
                  onClick={() => act(() => api.cancel(token))}
                >
                  dönem sonunda iptal et
                </button>
              ) : null}
            </>
          ) : (
            <div className="muted">aktif ücretli abonelik yok.</div>
          )}
        </Panel>
      </div>

      <div style={{ height: 16 }} />
      <Panel title="planlar" delay={120}>
        {plans && plans.prices.length > 0 ? (
          <div className="grid">
            {plans.prices.map((p) => (
              <div className="row" key={`${p.plan}-${p.interval}`}>
                <div>
                  <div className="v" style={{ textTransform: "uppercase", color: "var(--accent)" }}>
                    {p.plan} · {p.interval === "month" ? "aylık" : "yıllık"}
                  </div>
                  <div className="kpi">
                    {money(p.amountCents, p.currency)} / {p.interval === "month" ? "ay" : "yıl"}
                  </div>
                </div>
                <button
                  className="btn sm"
                  type="button"
                  disabled={busy}
                  onClick={() => act(() => api.subscribe(token, p.interval))}
                >
                  abone ol
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="muted">fiyat tanımlı değil.</div>
        )}
      </Panel>
    </>
  );
}
