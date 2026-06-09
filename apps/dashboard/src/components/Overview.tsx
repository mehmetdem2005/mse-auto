import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { api } from "../lib/api";
import { money, shortDate } from "../lib/format";
import { qk } from "../lib/query";
import { Banner, Panel } from "./ui";

export function Overview({ token }: { token: string }): ReactNode {
  const qc = useQueryClient();
  const subQ = useQuery({ queryKey: qk.subscription, queryFn: () => api.subscription(token) });
  const plansQ = useQuery({ queryKey: qk.plans, queryFn: () => api.plans(token) });
  const cancel = useMutation({
    mutationFn: () => api.cancel(token),
    onSuccess: (s) => qc.setQueryData(qk.subscription, s),
  });

  const sub = subQ.data ?? null;
  const plans = plansQ.data ?? null;
  const busy = cancel.isPending;
  const err =
    subQ.error || plansQ.error || cancel.error
      ? ((subQ.error || plansQ.error || cancel.error) as Error).message
      : null;
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
                  onClick={() => cancel.mutate()}
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
        <div className="muted" style={{ marginBottom: 12 }}>
          Ödeme entegrasyonu yakında — abonelik geçici olarak kapalı.
        </div>
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
                <button className="btn sm" type="button" disabled>
                  yakında
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
