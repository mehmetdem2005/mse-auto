import { useQuery } from "@tanstack/react-query";
import type { FeedItem } from "@watcher/contracts";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { qk } from "../lib/query";
import { Banner, Panel, Stat } from "./ui";

interface CtxState {
  x: number;
  y: number;
  item: FeedItem;
}

/** Material bağlam (sağ-tık) menüsü — imleç konumunda; kopyala eylemleri. */
function RowContextMenu({ ctx, onClose }: { ctx: CtxState; onClose: () => void }): ReactNode {
  useEffect(() => {
    const onDoc = (): void => onClose();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const copy = (text: string): void => {
    void navigator.clipboard?.writeText(text);
    onClose();
  };
  const items = [
    { label: "Açıklamayı kopyala", v: ctx.item.description || "" },
    { label: "Olgu (JSON) kopyala", v: JSON.stringify(ctx.item.facts ?? null) },
    { label: "Watcher ID kopyala", v: ctx.item.watchId },
  ];
  return (
    <div
      className="m3-menu-list"
      role="menu"
      aria-label="Tespit işlemleri"
      style={{ position: "fixed", left: ctx.x, top: ctx.y, right: "auto" }}
    >
      {items.map((it) => (
        <button
          key={it.label}
          type="button"
          role="menuitem"
          className="m3-menu-item"
          onClick={() => copy(it.v)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

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

/** Son 14 günün günlük tespit sayısı — CSS sınıflı çubuk grafik (a11y: role=img + özet). */
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
  const total = days.reduce((a, b) => a + b.count, 0);

  return (
    <div
      className="chart"
      role="img"
      aria-label={`Son 14 günde toplam ${total} tespit, günlük dağılım çubuk grafiği`}
    >
      {days.map((d) => (
        <div className="chart-col" key={d.label}>
          <div
            className={d.count ? "chart-bar" : "chart-bar empty"}
            // Yükseklik veri-bağımlı → tek meşru inline değer.
            style={{ height: `${Math.round((d.count / max) * 96)}px` }}
            title={`${d.label}: ${d.count} tespit`}
          />
          <span className="chart-lbl">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Feed({ token }: { token: string }): ReactNode {
  const [ctx, setCtx] = useState<CtxState | null>(null);
  const { data, error, isLoading } = useQuery({
    queryKey: qk.feed,
    queryFn: () => api.feed(token),
  });

  const list = data ?? [];
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
      {error ? (
        <Banner kind="err">{error instanceof Error ? error.message : "yüklenemedi"}</Banner>
      ) : null}

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
        {isLoading ? (
          <div className="muted">yükleniyor…</div>
        ) : list.length === 0 ? (
          <div className="muted">
            Henüz tespit yok. Watcher'ların bir şey yakaladığında burada görünür.
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Watcher</th>
                <th scope="col">Tespit</th>
                <th scope="col">Olgu</th>
                <th scope="col">Durum</th>
                <th scope="col">Zaman</th>
              </tr>
            </thead>
            <tbody>
              {list.slice(0, 50).map((it) => (
                <tr
                  key={it.deliveryId}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setCtx({ x: e.clientX, y: e.clientY, item: it });
                  }}
                >
                  <td className="tbl-strong">{it.watchIntent || "Watcher"}</td>
                  <td>{it.description || "Bir tespit oldu."}</td>
                  <td className="tbl-accent">{factSummary(it.facts)}</td>
                  <td>
                    <span className="chip">{it.status}</span>
                  </td>
                  <td className="tbl-num">{ago(it.detectedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
      {ctx ? <RowContextMenu ctx={ctx} onClose={() => setCtx(null)} /> : null}
    </>
  );
}
