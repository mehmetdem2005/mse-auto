import { db } from "@/lib/supabaseServer";
import { metrics } from "@studio/core";
import ControlPanel from "@/components/ControlPanel";
import RetryButton from "@/components/RetryButton";

export const dynamic = "force-dynamic";

export default async function Observability() {
  const m = await metrics.getMetrics();
  const { data: events } = await db.from("job_events").select("*").order("created_at", { ascending: false }).limit(40);
  const { data: dead } = await db.from("video_jobs").select("id,topic,last_error,attempts,stage").in("stage", ["dead_letter", "failed"]).order("updated_at", { ascending: false }).limit(20);

  const health = m.overBudget ? "bad" : m.paused ? "warn" : m.errorRate24h > 0.3 ? "warn" : "good";

  return (
    <>
      <div className="eyebrow">Operasyon</div>
      <h1>İzleme</h1>
      <p className="sub">Canlı sağlık, harcama ve pipeline'ın yaptığı her şeyin tekrar oynatılabilir kaydı. Bu, "izlenebilir / yönetilebilir" katmandır.</p>

      <div className="grid cards">
        <div className="card stat"><div className="n" style={{ color: `var(--${health})` }}>{m.paused ? "DURDU" : "CANLI"}</div><div className="l">Durum · {m.mode}</div></div>
        <div className="card stat"><div className="n">{(m.errorRate24h * 100).toFixed(0)}%</div><div className="l">24s hata oranı</div></div>
        <div className="card stat"><div className="n">${m.usdToday.toFixed(2)}</div><div className="l">Bugünkü harcama</div></div>
        <div className="card stat"><div className="n">{m.youtubeUnitsToday}</div><div className="l">Bugünkü YT kotası</div></div>
        <div className="card stat"><div className="n">{m.deadLetter}</div><div className="l">Ölü mektup</div></div>
      </div>

      <ControlPanel paused={m.paused} mode={m.mode} reason={null} />

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
        <div className="card">
          <div className="eyebrow" style={{ marginBottom: 10 }}>Ortalama aşama süresi</div>
          {Object.keys(m.avgStageMs).length === 0 && <div className="tag">Henüz zamanlama verisi yok.</div>}
          {Object.entries(m.avgStageMs).map(([s, ms]) => (
            <div className="row" key={s} style={{ justifyContent: "space-between", padding: "4px 0" }}>
              <span className="mono" style={{ fontSize: 13 }}>{s}</span><span className="mono" style={{ color: "var(--muted)" }}>{(ms / 1000).toFixed(1)}s</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="eyebrow" style={{ marginBottom: 10 }}>Pipeline sayıları</div>
          {Object.entries(m.stageCounts).map(([s, n]) => (
            <div className="row" key={s} style={{ justifyContent: "space-between", padding: "3px 0" }}>
              <span className="mono" style={{ fontSize: 13 }}>{s}</span><span className="mono">{n}</span>
            </div>
          ))}
        </div>
      </div>

      {!!dead?.length && (
        <>
          <h2 style={{ marginTop: 30, fontWeight: 500 }}>Ölü mektup / başarısız</h2>
          {dead.map((d: any) => (
            <div className="job" key={d.id} style={{ padding: 14 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span>{d.topic} <span className="badge bad">{d.stage}</span> <span className="tag">deneme {d.attempts}</span></span>
                <RetryButton id={d.id} />
              </div>
              {d.last_error && <div className="tag" style={{ color: "var(--warn)", marginTop: 6 }}>⚠ {d.last_error}</div>}
            </div>
          ))}
        </>
      )}

      <h2 style={{ marginTop: 30, fontWeight: 500 }}>Olay kaydı</h2>
      <table>
        <thead><tr><th>Zaman</th><th>Tür</th><th>Aşama</th><th>Detay</th></tr></thead>
        <tbody>
          {(events ?? []).map((ev: any) => (
            <tr key={ev.id}>
              <td className="mono" style={{ color: "var(--muted)" }}>{new Date(ev.created_at).toLocaleTimeString()}</td>
              <td><span className={`badge ${ev.type === "error" || ev.type === "dead_letter" ? "bad" : ev.type === "stage_ok" || ev.type === "uploaded" ? "good" : ""}`}>{ev.type}</span></td>
              <td className="mono">{ev.stage ?? "—"}</td>
              <td className="mono" style={{ color: "var(--muted)", fontSize: 12 }}>{ev.duration_ms ? `${(ev.duration_ms / 1000).toFixed(1)}s ` : ""}{ev.data?.message || ev.data?.reason || ev.data?.topic || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
