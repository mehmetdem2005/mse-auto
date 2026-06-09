import type {
  AdminStats,
  AdminSubscription,
  AdminSystem,
  AdminUser,
  AdminWatch,
  BillingInterval,
  Plans,
} from "@watcher/contracts";
import { type CSSProperties, type ReactNode, useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { money, shortDate } from "../lib/format";
import { Banner, Panel, Stat } from "./ui";

const msg = (e: unknown): string => (e instanceof Error ? e.message : "işlem başarısız");

type Tab = "analytics" | "users" | "watches" | "subs" | "system";
const TABS: { id: Tab; label: string }[] = [
  { id: "analytics", label: "Analitik" },
  { id: "users", label: "Kullanıcılar" },
  { id: "watches", label: "Watcher'lar" },
  { id: "subs", label: "Abonelikler" },
  { id: "system", label: "Sistem" },
];

export function Admin({ token }: { token: string }): ReactNode {
  const [tab, setTab] = useState<Tab>("analytics");
  return (
    <>
      <h1 className="page-title">Admin</h1>
      <p className="page-sub">yönetim konsolu · kullanıcı · watcher · abonelik · sistem</p>
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="fade-in" key={tab}>
        {tab === "analytics" ? <Analytics token={token} /> : null}
        {tab === "users" ? <Users token={token} /> : null}
        {tab === "watches" ? <Watches token={token} /> : null}
        {tab === "subs" ? <Subs token={token} /> : null}
        {tab === "system" ? <System token={token} /> : null}
      </div>
    </>
  );
}

/** Yükleme iskeleti (shimmer). */
const SKEL_KEYS = ["s0", "s1", "s2", "s3", "s4", "s5", "s6", "s7"];
function Skeleton({ rows = 4 }: { rows?: number }): ReactNode {
  return (
    <div>
      {SKEL_KEYS.slice(0, rows).map((k) => (
        <div className="skeleton" key={k} />
      ))}
    </div>
  );
}

// ----------------------------- Analitik + Fiyat -----------------------------

function Analytics({ token }: { token: string }): ReactNode {
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
      setErr(msg(e));
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
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
        <Skeleton rows={2} />
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

// ----------------------------- Kullanıcılar -----------------------------

function Users({ token }: { token: string }): ReactNode {
  const [rows, setRows] = useState<AdminUser[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      setRows(await api.adminUsers(token));
    } catch (e) {
      setErr(msg(e));
    }
  }, [token]);
  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: string, fn: () => Promise<unknown>, confirmMsg?: string): Promise<void> {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(id);
    setErr(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setErr(msg(e));
    }
    setBusy(null);
  }

  if (!rows) return <Skeleton rows={5} />;
  return (
    <>
      {err ? <Banner kind="err">{err}</Banner> : null}
      <div className="muted" style={{ marginBottom: 10 }}>
        {rows.length} kullanıcı
      </div>
      <div className="grid">
        {rows.map((u) => (
          <Panel key={u.id}>
            <div className="row">
              <div>
                <div className="v">{u.email ?? "(e-posta yok)"}</div>
                <div className="kpi">
                  {u.plan.toUpperCase()} · {u.watchCount} watcher · {shortDate(u.createdAt)}
                  {u.isAdmin ? " · ADMIN" : ""}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              <button
                className="btn sm"
                type="button"
                disabled={busy === u.id}
                onClick={() => act(u.id, () => api.setUserAdmin(token, u.id, !u.isAdmin))}
              >
                {u.isAdmin ? "admin yetkisini al" : "admin yap"}
              </button>
              <button
                className="btn sm"
                type="button"
                disabled={busy === u.id}
                onClick={() => act(u.id, () => api.giftPro(token, u.id, "month"))}
              >
                pro hediye (ay)
              </button>
              <button
                className="btn sm"
                type="button"
                disabled={busy === u.id}
                onClick={() => act(u.id, () => api.giftPro(token, u.id, "year"))}
              >
                pro hediye (yıl)
              </button>
              <button
                className="btn sm"
                type="button"
                disabled={busy === u.id}
                onClick={() => act(u.id, () => api.cancelUserSub(token, u.id))}
              >
                aboneliği iptal
              </button>
              <button
                className="btn danger sm"
                type="button"
                disabled={busy === u.id}
                onClick={() =>
                  act(
                    u.id,
                    () => api.deleteUser(token, u.id),
                    `${u.email ?? u.id} hesabı KALICI silinsin mi? (tüm verisi gider)`,
                  )
                }
              >
                hesabı sil
              </button>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}

// ----------------------------- Watcher'lar -----------------------------

function Watches({ token }: { token: string }): ReactNode {
  const [rows, setRows] = useState<AdminWatch[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      setRows(await api.adminWatches(token));
    } catch (e) {
      setErr(msg(e));
    }
  }, [token]);
  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: string, fn: () => Promise<unknown>, confirmMsg?: string): Promise<void> {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(id);
    setErr(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setErr(msg(e));
    }
    setBusy(null);
  }

  if (!rows) return <Skeleton rows={5} />;
  return (
    <>
      {err ? <Banner kind="err">{err}</Banner> : null}
      <div className="muted" style={{ marginBottom: 10 }}>
        {rows.length} watcher
      </div>
      <div className="grid">
        {rows.map((w) => (
          <Panel key={w.id}>
            <div className="v" style={{ marginBottom: 4 }}>
              {w.rawIntent}
            </div>
            <div className="kpi">
              {w.userEmail ?? w.userId} · her {w.frequencyMinutes} dk ·{" "}
              {w.status === "active" ? "aktif" : "duraklatıldı"} ·{" "}
              {w.archetype === "shared" ? "paylaşılan" : "kişisel"}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              <button
                className="btn sm"
                type="button"
                disabled={busy === w.id}
                onClick={() =>
                  act(w.id, () =>
                    api.setWatchStatus(token, w.id, w.status === "active" ? "paused" : "active"),
                  )
                }
              >
                {w.status === "active" ? "duraklat" : "aktifleştir"}
              </button>
              <button
                className="btn danger sm"
                type="button"
                disabled={busy === w.id}
                onClick={() =>
                  act(w.id, () => api.deleteWatch(token, w.id), "Bu watcher silinsin mi?")
                }
              >
                sil
              </button>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}

// ----------------------------- Abonelikler -----------------------------

function Subs({ token }: { token: string }): ReactNode {
  const [rows, setRows] = useState<AdminSubscription[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    api
      .adminSubscriptions(token)
      .then((r) => on && setRows(r))
      .catch((e) => on && setErr(msg(e)));
    return () => {
      on = false;
    };
  }, [token]);

  if (err) return <Banner kind="err">{err}</Banner>;
  if (!rows) return <Skeleton rows={3} />;
  if (rows.length === 0) return <div className="muted">abonelik yok.</div>;
  return (
    <div className="grid">
      {rows.map((s) => (
        <Panel key={s.userId}>
          <div className="row">
            <div>
              <div className="v">{s.userEmail ?? s.userId}</div>
              <div className="kpi">
                {s.plan.toUpperCase()} ·{" "}
                {s.interval ? (s.interval === "month" ? "aylık" : "yıllık") : "—"} ·{" "}
                {s.amountCents !== null ? money(s.amountCents, s.currency) : "—"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="v">{s.status === "active" ? "aktif" : "iptal"}</div>
              <div className="kpi">
                {s.cancelAtPeriodEnd ? "dönem sonu iptal · " : ""}
                {s.currentPeriodEnd ? shortDate(s.currentPeriodEnd) : "—"}
              </div>
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
}

// ----------------------------- Sistem -----------------------------

function System({ token }: { token: string }): ReactNode {
  const [sys, setSys] = useState<AdminSystem | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    api
      .adminSystem(token)
      .then((s) => on && setSys(s))
      .catch((e) => on && setErr(msg(e)));
    return () => {
      on = false;
    };
  }, [token]);

  if (err) return <Banner kind="err">{err}</Banner>;
  if (!sys) return <Skeleton rows={4} />;
  return (
    <>
      <div className="muted" style={{ marginBottom: 10 }}>
        backend: {sys.backend} · {shortDate(sys.now)}
      </div>
      <div className="stats">
        <Stat n={String(sys.counts.users)} label="kullanıcı" delay={0} />
        <Stat n={String(sys.counts.watches)} label="watcher" delay={40} />
        <Stat n={String(sys.counts.activeWatches)} label="aktif watcher" tone="accent" delay={80} />
        <Stat n={String(sys.counts.subscriptions)} label="abonelik" delay={120} />
      </div>
      <div style={{ height: 14 }} />
      <div className="stats">
        <Stat n={String(sys.counts.deliveries)} label="teslimat" delay={0} />
        <Stat n={String(sys.counts.checkRuns)} label="kontrol çalışması" delay={40} />
      </div>

      <div style={{ height: 22 }} />
      <Panel title="son kontroller">
        {sys.recentCheckRuns.length > 0 ? (
          sys.recentCheckRuns.map((r) => (
            <div className="row" key={r.id}>
              <span className="k">{shortDate(r.ranAt)}</span>
              <span className="v">
                {r.decision ? "● tespit" : "○ yok"}
                {r.confidence !== null ? ` (${Math.round(r.confidence * 100)}%)` : ""}
                {r.summary ? ` · ${r.summary}` : ""}
              </span>
            </div>
          ))
        ) : (
          <div className="muted">kayıt yok.</div>
        )}
      </Panel>
      <div style={{ height: 16 }} />
      <Panel title="son teslimatlar">
        {sys.recentDeliveries.length > 0 ? (
          sys.recentDeliveries.map((d) => (
            <div className="row" key={d.id}>
              <span className="k">{d.sentAt ? shortDate(d.sentAt) : "—"}</span>
              <span className="v">
                {d.channel} · {d.status}
              </span>
            </div>
          ))
        ) : (
          <div className="muted">kayıt yok.</div>
        )}
      </Panel>
    </>
  );
}

// ----------------------------- Fiyat düzenleyici -----------------------------

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
      setErr(msg(e));
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
