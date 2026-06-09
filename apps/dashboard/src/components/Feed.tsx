import type { FeedItem } from "@watcher/contracts";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { Banner, Panel, Stat } from "./ui";

/** Güvenilmez facts'i kısa okunur özete çevirir. */
function factSummary(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "—";
  const f = raw as Record<string, unknown>;
  const parts: string[] = [];
  const geo = f.geo as { lat?: number; lng?: number } | undefined;
  if (geo && typeof geo.lat === "number" && typeof geo.lng === "number") {
    parts.push(`📍 ${geo.lat.toFixed(2)}, ${geo.lng.toFixed(2)}`);
  }
  if (typeof f.numeric === "number") {
    const kind = typeof f.numericKind === "string" ? `${f.numericKind}: ` : "";
    const cur = typeof f.currency === "string" ? ` ${f.currency}` : "";
    parts.push(`${kind}${f.numeric.toLocaleString("tr-TR")}${cur}`);
  }
  if (typeof f.text === "string") parts.push(`“${f.text.slice(0, 40)}”`);
  return parts.length ? parts.join(" · ") : "—";
}

function ago(iso: string): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} gün önce`;
  return new Date(iso).toLocaleDateString("tr-TR");
}

/** Son 14 günün günlük tespit sayısı (inline CSS çubuk grafik). */
function DayChart({ items }: { items: FeedItem[] }): ReactNode {
  const days = useMemo(() => {
    const buckets: { label: string; count: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const count = items.filter((it) => {
        const t = new Date(it.detectedAt).getTime();
        return t >= d.getTime() && t < next.getTime();
      }).length;
      buckets.push({ label: d.toLocaleDateString("tr-TR", { day: "2-digit" }), count });
    }
    return buckets;
  }, [items]);
  const max = Math.max(1, ...days.map((d) => d.count));

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
      {days.map((d) => (
        <div
          key={d.label}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            title={`${d.count} tespit`}
            style={{
              width: "100%",
              height: `${Math.round((d.count / max) * 96)}px`,
              minHeight: 3,
              background: d.count
                ? "linear-gradient(180deg, var(--accent), var(--accent-dim))"
                : "var(--panel-2)",
              borderRadius: 6,
              transition: "height 0.4s ease",
            }}
          />
          <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted-2)" }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Feed({ token }: { token: string }): ReactNode {
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      setItems(await api.feed(token));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "yüklenemedi");
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const list = items ?? [];
  const last24 = list.filter(
    (it) => Date.now() - new Date(it.detectedAt).getTime() < 86_400_000,
  ).length;
  const watchers = new Set(list.map((it) => it.watchId)).size;
  const lastSeen = list.length
    ? list.reduce((a, b) => (a.detectedAt > b.detectedAt ? a : b)).detectedAt
    : "";

  return (
    <>
      <h1 className="page-title">Aktivite akışı</h1>
      <p className="page-sub">watcher'larından gelen tespitler</p>
      {err ? <Banner kind="err">{err}</Banner> : null}

      <div className="stats">
        <Stat n={String(list.length)} label="toplam tespit" tone="accent" />
        <Stat n={String(last24)} label="son 24 saat" tone="pos" delay={60} />
        <Stat n={String(watchers)} label="farklı watcher" delay={120} />
        <Stat n={lastSeen ? ago(lastSeen) : "—"} label="son tespit" delay={180} />
      </div>

      <div style={{ height: 16 }} />
      <Panel title="son 14 gün" delay={120}>
        <DayChart items={list} />
      </Panel>

      <div style={{ height: 16 }} />
      <Panel title={`son tespitler (${list.length})`} delay={180}>
        {items === null ? (
          <div className="muted">yükleniyor…</div>
        ) : list.length === 0 ? (
          <div className="muted">
            Henüz tespit yok. Watcher'ların bir şey yakaladığında burada görünür.
          </div>
        ) : (
          list.slice(0, 50).map((it) => (
            <div className="row" key={it.deliveryId}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  className="v"
                  style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                >
                  {it.watchIntent || "Watcher"}
                </div>
                <div className="kpi" style={{ marginTop: 3 }}>
                  {it.description || "Bir tespit oldu."}
                </div>
                <div className="kpi" style={{ marginTop: 2, color: "var(--accent)" }}>
                  {factSummary(it.facts)}
                </div>
              </div>
              <div style={{ textAlign: "right", flex: "none" }}>
                <span className="chip">{it.status}</span>
                <div className="kpi" style={{ marginTop: 6 }}>
                  {ago(it.detectedAt)}
                </div>
              </div>
            </div>
          ))
        )}
      </Panel>
    </>
  );
}
