import { db } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const sev = (s: string) => (s === "crit" ? "bad" : s === "warn" ? "warn" : "good");
const riskColor = (r: string) => (r === "high" ? "bad" : r === "medium" ? "warn" : "good");

async function safe<T>(p: PromiseLike<{ data: T | null }>): Promise<T | null> {
  try { return (await p).data; } catch { return null; }
}

export default async function Lab() {
  const improvements = (await safe<any[]>(db.from("improvements").select("*").order("created_at", { ascending: false }).limit(30))) ?? [];
  const opportunities = (await safe<any[]>(db.from("opportunities").select("*").eq("status", "open").order("score", { ascending: false }).limit(30))) ?? [];
  const panels = (await safe<any[]>(db.from("panels").select("*").order("updated_at", { ascending: false }))) ?? [];

  return (
    <>
      <div className="eyebrow">Autonomy</div>
      <h1>Autonomy Lab</h1>
      <p className="sub">
        Kendi kendini iyileştiren katman: geniş sinyaller → fırsatlar → <strong>PR tabanlı</strong> kod önerileri (CI zorunlu kapı,
        düşük-risk + opt-in otomatik-merge), ve ajanın yazdığı <strong>dinamik tablolar</strong>. Birleştirilen PR'ları ara ara gözden geçir.
      </p>

      {/* Self-improvement PRs */}
      <h2 style={{ marginTop: 24, fontWeight: 500 }}>İyileştirme PR&apos;ları</h2>
      {!improvements.length && <div className="tag">Henüz PR yok. (SELF_IMPROVE_ENABLED + GitHub kimlik bilgileri gerekir.)</div>}
      {!!improvements.length && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ textAlign: "left", color: "var(--muted)" }}>
              <th style={{ padding: "8px 12px" }}>PR</th><th>Başlık</th><th>Risk</th><th>Durum</th><th>Dosyalar</th>
            </tr></thead>
            <tbody>
              {improvements.map((i) => (
                <tr key={i.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 12px" }} className="mono">{i.url ? <a href={i.url} target="_blank">#{i.pr_number}</a> : `#${i.pr_number}`}</td>
                  <td>{i.title}</td>
                  <td><span className={`badge ${riskColor(i.risk)}`}>{i.risk}</span></td>
                  <td><span className="tag">{i.status}</span></td>
                  <td className="mono" style={{ color: "var(--muted)" }}>{(i.files || []).join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Opportunities */}
      <h2 style={{ marginTop: 30, fontWeight: 500 }}>Fırsatlar (geniş sinyal — sadece hata değil)</h2>
      {!opportunities.length && <div className="tag">Açık fırsat yok. Supervisor periyodik tarar (AUTONOMY_EVERY_TICKS).</div>}
      {opportunities.map((o) => (
        <div className="job" key={o.id} style={{ padding: 14 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span><span className={`badge ${sev(o.severity)}`}>{o.severity}</span> <strong>{o.area}</strong> · {o.title} <span className="tag">skor {o.score}</span></span>
          </div>
          {o.suggestion && <div className="tag" style={{ marginTop: 6 }}>{o.suggestion}</div>}
        </div>
      ))}

      {/* Dynamic agent-written tables */}
      <h2 style={{ marginTop: 30, fontWeight: 500 }}>Dinamik Tablolar (ajan yazıyor)</h2>
      {!panels.length && <div className="tag">Henüz panel yok.</div>}
      {panels.map((p) => (
        <div className="card" key={p.key} style={{ padding: 0, overflow: "hidden", marginBottom: 14 }}>
          <div className="eyebrow" style={{ padding: "10px 12px" }}>{p.title || p.key}</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ textAlign: "left", color: "var(--muted)" }}>
              {(p.columns || []).map((c: string, idx: number) => <th key={idx} style={{ padding: "8px 12px" }}>{c}</th>)}
            </tr></thead>
            <tbody>
              {(p.rows || []).map((row: any[], ri: number) => (
                <tr key={ri} style={{ borderTop: "1px solid var(--border)" }}>
                  {row.map((cell, ci) => <td key={ci} style={{ padding: "8px 12px" }} className="mono">{String(cell)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}
