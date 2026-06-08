import type { BillingInterval, Plans } from "@watcher/contracts";
import type { AdminStats } from "@watcher/contracts";
import { type CSSProperties, type ReactNode, useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { money } from "../lib/format";
import { Banner, Panel, Stat } from "./ui";

export function Admin({ token }: { token: string }): ReactNode {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [prices, setPrices] = useState<Plans | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [s, p] = await Promise.all([api.adminStats(token), api.adminPrices(token)]);
      setStats(s);
      setPrices(p);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "yüklenemedi");
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <h1 className="page-title">Admin · Analitik</h1>
      <p className="page-sub">kullanıcılar · abonelikler · gelir · fiyatlandırma</p>
      {err ? <Banner kind="err">{err}</Banner> : null}

      {stats ? (
        <>
          <div className="stats">
            <Stat n={String(stats.totalUsers)} label="toplam kullanıcı" delay={0} />
            <Stat n={String(stats.proUsers)} label="pro abone" tone="accent" delay={40} />
            <Stat n={String(stats.freeUsers)} label="ücretsiz" delay={80} />
            <Stat
              n={money(stats.mrrCents)}
              label="MRR · aylık gelir"
              tone="pos"
              sub={`${money(stats.mrrCents * 12)} / yıl`}
              delay={120}
            />
          </div>
          <div style={{ height: 14 }} />
          <div className="stats">
            <Stat n={String(stats.activeSubscriptions)} label="aktif abonelik" delay={0} />
            <Stat n={String(stats.subscriptionsByInterval.month)} label="aylık abone" delay={40} />
            <Stat n={String(stats.subscriptionsByInterval.year)} label="yıllık abone" delay={80} />
            <Stat
              n={`${stats.activeWatchers} / ${stats.totalWatchers}`}
              label="aktif / toplam watcher"
              delay={120}
            />
          </div>
        </>
      ) : (
        <div className="muted">analitik yükleniyor…</div>
      )}

      <div style={{ height: 22 }} />
      <Panel title="fiyatlandırma">
        <Banner kind="note">
          Fiyat değişimi yalnız yeni satın almalar ve yenilemeler için geçerlidir. Mevcut aboneler
          dönemleri (aylık/yıllık) bitene kadar eski fiyattan devam eder.
        </Banner>
        <div className="grid cols-2">
          <PriceEditor token={token} interval="month" plans={prices} onSaved={setPrices} />
          <PriceEditor token={token} interval="year" plans={prices} onSaved={setPrices} />
        </div>
      </Panel>
    </>
  );
}

function PriceEditor({
  token,
  interval,
  plans,
  onSaved,
}: {
  token: string;
  interval: BillingInterval;
  plans: Plans | null;
  onSaved: (p: Plans) => void;
}): ReactNode {
  const current = plans?.prices.find((p) => p.interval === interval) ?? null;
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (current) setValue((current.amountCents / 100).toString());
  }, [current]);

  async function save(): Promise<void> {
    const dollars = Number(value);
    if (!Number.isFinite(dollars) || dollars < 0) {
      setErr("geçersiz tutar");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const updated = await api.setPrice(
        token,
        interval,
        Math.round(dollars * 100),
        current?.currency ?? "usd",
      );
      onSaved(updated);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "kaydedilemedi");
    }
    setBusy(false);
  }

  const staticStyle: CSSProperties = { animation: "none", opacity: 1, transform: "none" };
  return (
    <div className="panel" style={staticStyle}>
      <h3>pro · {interval === "month" ? "aylık" : "yıllık"}</h3>
      <div className="field">
        <label htmlFor={`price-${interval}`}>tutar (USD)</label>
        <div className="prefix">
          <span>$</span>
          <input
            id={`price-${interval}`}
            className="input"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="4.99"
          />
        </div>
      </div>
      {err ? (
        <div className="banner err" style={{ marginTop: 12, marginBottom: 0 }}>
          {err}
        </div>
      ) : null}
      <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
        <button className="btn sm" type="button" disabled={busy || !value} onClick={save}>
          kaydet
        </button>
        <span className="kpi">
          şu an: <b>{current ? money(current.amountCents, current.currency) : "—"}</b>
        </span>
      </div>
    </div>
  );
}
