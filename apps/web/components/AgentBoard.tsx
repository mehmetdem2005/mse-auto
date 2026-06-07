"use client";
import { useMemo, useState } from "react";

type Roster = { id: string; title: string; description: string; critical?: boolean };
type Props = {
  crew: Roster[];
  board: Roster[];
  review: any;
  job: { topic: string; stage: string; updated_at: string } | null;
  events: any[];
  live: boolean;
};

const STATUS: Record<string, { label: string }> = {
  run: { label: "çalışıyor" }, pass: { label: "geçti" }, fail: { label: "kaldı / veto" },
  ran: { label: "çalıştı" }, idle: { label: "beklemede" },
};
const initials = (s: string) => s.replace(/[()]/g, "").split(/[\s/_-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
const lineColor = (s: string) => s === "run" ? "rgba(34,211,238,.9)" : s === "pass" ? "rgba(70,211,154,.55)" : s === "fail" ? "rgba(255,93,93,.55)" : s === "ran" ? "rgba(255,176,46,.5)" : "rgba(34,211,238,.16)";
const placeXY = (i: number, n: number, r: number) => { const a = (-90 + (i * 360) / n) * (Math.PI / 180); return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) }; };

export default function AgentBoard({ crew, board, review, job, events, live }: Props) {
  const verdicts: any[] = review?.verdicts ?? [];
  const crewLog: any[] = review?.crew ?? [];
  const plan: any[] = review?.plan ?? [];
  const decision = review?.decision ?? null;

  const boardState = useMemo(() => {
    const m: Record<string, any> = {};
    for (const a of board) {
      const v = verdicts.find((x) => x.role === a.id);
      let status = "idle";
      if (live) status = "run"; else if (v) status = v.pass ? "pass" : "fail";
      m[a.id] = { status, verdict: v };
    }
    return m;
  }, [board, verdicts, live]);

  const crewState = useMemo(() => {
    const m: Record<string, any> = {};
    for (const a of crew) {
      const log = crewLog.find((x) => x.role === a.id);
      const inPlan = plan.find((t: any) => (t.role || t.id) === a.id);
      let status = "idle";
      if (live && (log || inPlan)) status = "run"; else if (log) status = log.ok === false ? "fail" : "ran";
      m[a.id] = { status, log, inPlan };
    }
    return m;
  }, [crew, crewLog, plan, live]);

  const autoFocus = useMemo(() => {
    const pick = (list: Roster[], st: Record<string, any>, want: string[]) => {
      for (const w of want) { const hit = list.find((a) => st[a.id]?.status === w); if (hit) return hit.id; }
      return null;
    };
    return pick(crew, crewState, ["run", "fail", "ran"]) || pick(board, boardState, ["run", "fail", "pass"]);
  }, [crew, board, crewState, boardState]);

  const [open, setOpen] = useState<string | null>(autoFocus);
  const sel = open ?? autoFocus;

  const crewPos = crew.map((a, i) => ({ a, kind: "crew" as const, st: crewState[a.id], ...placeXY(i, crew.length, 31) }));
  const boardPos = board.map((a, i) => ({ a, kind: "board" as const, st: boardState[a.id], ...placeXY(i, board.length, 47) }));
  const allPos = [...crewPos, ...boardPos];

  const count = (s: string) => allPos.filter((p) => p.st?.status === s).length;
  const selNode = allPos.find((p) => p.a.id === sel);

  function renderDetail(node: NonNullable<typeof selNode>) {
    const { a, kind, st } = node;
    const v = st?.verdict; const log = st?.log;
    const lbl = STATUS[st?.status]?.label ?? "beklemede";
    const cls = st?.status === "pass" ? "good" : st?.status === "fail" ? "bad" : st?.status === "run" ? "review" : "";
    return (
      <>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
          <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{a.title}</span>
          <span className={`badge ${cls}`}>{lbl}</span>
        </div>
        <div className="arole" style={{ marginBottom: 10 }}>{a.id}{a.critical ? " · VETO yetkisi" : ""}</div>
        <p className="desc" style={{ fontSize: 13 }}>{a.description}</p>
        {kind === "board" && v && (
          <>
            <div className="row" style={{ gap: 6, flexWrap: "wrap", margin: "8px 0" }}>
              <span className={`badge ${v.pass ? "good" : "bad"}`}>{v.pass ? "✓ geçti" : "✗ kaldı"}</span>
              <span className="badge">puan {v.score}</span><span className="badge">{v.severity}</span>
            </div>
            <div className="convo"><span className="who">{a.title}:</span>{"\n"}
              {(v.issues?.length ? v.issues : ["— sorun bildirmedi —"]).map((s: string) => `• ${s}`).join("\n")}
              {v.required_fixes?.length ? `\n\nİstenen düzeltmeler:\n${v.required_fixes.map((s: string) => `→ ${s}`).join("\n")}` : ""}
            </div>
          </>
        )}
        {kind === "crew" && log && (
          <>
            <div className="row" style={{ gap: 6, flexWrap: "wrap", margin: "8px 0" }}>
              <span className={`badge ${log.ok === false ? "bad" : "good"}`}>{log.ok === false ? "hata" : "tamamlandı"}</span>
              {typeof log.steps === "number" && <span className="badge">{log.steps} adım</span>}
            </div>
            {log.goal && <div className="tag" style={{ marginBottom: 6 }}>🎯 {log.goal}</div>}
            <div className="convo"><span className="who">{a.title}:</span>{"\n"}{log.error ? `⚠ ${log.error}` : (typeof log.output === "string" ? log.output : JSON.stringify(log.output, null, 2)) || "— çıktı yok —"}</div>
          </>
        )}
        {((kind === "board" && !v) || (kind === "crew" && !log)) && (
          <div className="tag" style={{ marginTop: 8 }}>Bu ajan son turda görev almadı. İlk üretimde konuşması/logu burada görünür.</div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="eyebrow">AI CORE · Kontrol Merkezi</div>
      <h1>Ajanlar</h1>
      <p className="sub">
        Holografik ajan ağı. Ortadaki çekirdek yöneticidir; iç yörüngede <b>üretim ekibi</b>, dış yörüngede
        <b> denetçi kurulu</b>. Bir tur sırasında çalışan ajanın <b>ışıkları yanar, bağlantısı parlar ve odak ona kayar</b>.
      </p>

      <div className="holo-stage">
        {/* SOL — sistem durumu */}
        <div className="holo-panel">
          <div className="eyebrow">Sistem Durumu</div>
          <div className="holo-stat"><span className="k">Durum</span><span className="v" style={{ color: live ? "var(--cy)" : "#a7ecf7" }}>{live ? "● CANLI" : "○ HAZIR"}</span></div>
          <div className="holo-stat"><span className="k">Toplam ajan</span><span className="v">{crew.length + board.length}</span></div>
          <div className="holo-stat"><span className="k">Çalışan</span><span className="v">{count("run")}</span></div>
          <div className="holo-stat"><span className="k">Geçti</span><span className="v">{count("pass") + count("ran")}</span></div>
          <div className="holo-stat"><span className="k">Kaldı / veto</span><span className="v">{count("fail")}</span></div>
          <div className="holo-stat"><span className="k">Son aşama</span><span className="v">{job?.stage ?? "—"}</span></div>
          <div className="holo-stat"><span className="k">Kurul kararı</span><span className="v">{decision ? `${decision.verdict} ${decision.passCount}/${review.reviewerCount}` : "—"}</span></div>
          <div className="holo-stat"><span className="k">Olay kaydı</span><span className="v">{events.length}</span></div>
        </div>

        {/* ORTA — hologram */}
        <div className="holo">
          <div className="holo-ring r2" /><div className="holo-ring r3" /><div className="holo-ring r1" />
          <div className="holo-scan" />
          <svg className="holo-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
            {allPos.map((p) => (
              <line key={p.a.id} x1="50" y1="50" x2={p.x} y2={p.y}
                stroke={lineColor(p.st?.status)} strokeWidth={sel === p.a.id ? 0.8 : 0.4} />
            ))}
          </svg>
          <div className={`holo-core ${live ? "alive" : ""}`}>
            <span className="hc-state">{live ? "CANLI" : decision ? decision.verdict.toUpperCase() : "AI CORE"}</span>
            <span className="hc-sub">{job ? (job.stage || "—") : "● ONLINE"}</span>
          </div>
          {allPos.map((p) => {
            const lbl = STATUS[p.st?.status]?.label ?? "";
            return (
              <button key={p.a.id} type="button"
                className={`holo-node ag-${p.st?.status} ${sel === p.a.id ? "sel" : ""}`}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                onClick={() => setOpen(sel === p.a.id ? null : p.a.id)}
                title={`${p.a.title} — ${lbl}`}>
                <span className="orb"><span className="orb-i">{initials(p.a.title)}</span></span>
                <span className="nlabel">{p.a.title}</span>
              </button>
            );
          })}
        </div>

        {/* SAĞ — aktif ajan */}
        <div className="holo-panel">
          <div className="eyebrow">Aktif Ajan</div>
          {selNode ? renderDetail(selNode) : <div className="tag">Bir ajana dokun → görevi ve logu burada açılır.</div>}
        </div>
      </div>

      <div className="legend" style={{ justifyContent: "center" }}>
        <span><i style={{ background: "var(--cy)" }} />çalışıyor</span>
        <span><i style={{ background: "var(--good)" }} />geçti</span>
        <span><i style={{ background: "var(--bad)" }} />kaldı / veto</span>
        <span><i style={{ background: "var(--accent)" }} />çalıştı</span>
        <span><i style={{ background: "#3a3f49" }} />beklemede</span>
      </div>

      {!!events.length && (
        <>
          <h2 style={{ marginTop: 26 }}>Son olay kayıtları</h2>
          <table>
            <thead><tr><th>Zaman</th><th>Tür</th><th>Aşama</th><th>Detay</th></tr></thead>
            <tbody>
              {events.map((ev, i) => (
                <tr key={i}>
                  <td className="mono" style={{ color: "var(--muted)" }}>{new Date(ev.created_at).toLocaleTimeString()}</td>
                  <td><span className="badge">{ev.type}</span></td>
                  <td className="mono">{ev.stage ?? "—"}</td>
                  <td className="mono" style={{ color: "var(--muted)", fontSize: 12 }}>{ev.data?.message || ev.data?.reason || ev.data?.topic || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
