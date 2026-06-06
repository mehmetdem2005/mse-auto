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

// status → css class + label
const STATUS: Record<string, { cls: string; label: string }> = {
  run: { cls: "ag-run", label: "çalışıyor" },
  pass: { cls: "ag-pass", label: "geçti" },
  fail: { cls: "ag-fail", label: "kaldı / veto" },
  ran: { cls: "ag-ran", label: "çalıştı" },
  idle: { cls: "ag-idle", label: "beklemede" },
};

export default function AgentBoard({ crew, board, review, job, events, live }: Props) {
  const [open, setOpen] = useState<string | null>(null);

  const verdicts: any[] = review?.verdicts ?? [];
  const crewLog: any[] = review?.crew ?? [];
  const plan: any[] = review?.plan ?? [];
  const decision = review?.decision ?? null;

  // map role → status/data for the review board
  const boardState = useMemo(() => {
    const m: Record<string, any> = {};
    for (const a of board) {
      const v = verdicts.find((x) => x.role === a.id);
      let status: string = "idle";
      if (live) status = "run";
      else if (v) status = v.pass ? "pass" : "fail";
      m[a.id] = { status, verdict: v };
    }
    return m;
  }, [board, verdicts, live]);

  // map role → status/data for the crew
  const crewState = useMemo(() => {
    const m: Record<string, any> = {};
    for (const a of crew) {
      const log = crewLog.find((x) => x.role === a.id);
      const inPlan = plan.find((t: any) => (t.role || t.id) === a.id);
      let status: string = "idle";
      if (live && (log || inPlan)) status = "run";
      else if (log) status = log.ok === false ? "fail" : "ran";
      m[a.id] = { status, log, inPlan };
    }
    return m;
  }, [crew, crewLog, plan, live]);

  function Card({ a, state }: { a: Roster; state: any }) {
    const st = STATUS[state.status] ?? STATUS.idle;
    const isOpen = open === a.id;
    return (
      <div className={`agent ${st.cls}`} onClick={() => setOpen(isOpen ? null : a.id)}>
        <div className="ahead">
          <span className="dot" />
          <span className="aname">{a.title}</span>
          {a.critical && <span className="crit">VETO</span>}
        </div>
        <div className="arole">{a.id}</div>
        <div className="ameta">{st.label}{isOpen ? " · ▲" : " · ▼"}</div>
      </div>
    );
  }

  function Detail({ a, kind }: { a: Roster; kind: "crew" | "board" }) {
    const state = kind === "board" ? boardState[a.id] : crewState[a.id];
    const v = state?.verdict;
    const log = state?.log;
    return (
      <div className="agent-detail">
        <h4>{a.title} <span className="arole">· {a.id}</span></h4>
        <p className="desc">{a.description}</p>

        {kind === "board" && v && (
          <>
            <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              <span className={`badge ${v.pass ? "good" : "bad"}`}>{v.pass ? "✓ geçti" : "✗ kaldı"}</span>
              <span className="badge">puan {v.score}</span>
              <span className="badge">önem: {v.severity}</span>
            </div>
            <div className="convo">
              <span className="who">{a.title} (denetçi):</span>{"\n"}
              {(v.issues?.length ? v.issues : ["— sorun bildirmedi —"]).map((s: string) => `• ${s}`).join("\n")}
              {v.required_fixes?.length ? `\n\nİstenen düzeltmeler:\n${v.required_fixes.map((s: string) => `→ ${s}`).join("\n")}` : ""}
            </div>
          </>
        )}

        {kind === "crew" && log && (
          <>
            <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              <span className={`badge ${log.ok === false ? "bad" : "good"}`}>{log.ok === false ? "hata" : "tamamlandı"}</span>
              {typeof log.steps === "number" && <span className="badge">{log.steps} adım</span>}
              {!!log.tools?.length && <span className="badge">araçlar: {[...new Set(log.tools)].join(", ")}</span>}
            </div>
            {log.goal && <div className="tag" style={{ marginBottom: 6 }}>🎯 {log.goal}</div>}
            <div className="convo">
              <span className="who">{a.title}:</span>{"\n"}
              {log.error ? `⚠ ${log.error}` : (typeof log.output === "string" ? log.output : JSON.stringify(log.output, null, 2)) || "— çıktı yok —"}
            </div>
          </>
        )}

        {((kind === "board" && !v) || (kind === "crew" && !log)) && (
          <div className="tag">Bu ajan son çalışmada görev almadı. İlk pipeline turunda burada konuşması/logu görünecek.</div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="eyebrow">Kontrol odası</div>
      <h1>Ajanlar</h1>
      <p className="sub">
        Sistemdeki tüm ajanlar. Bir üretim turunda hangisi çalıştıysa <b>neon ışıkla</b> yanar; üzerine
        tıklayınca o ajanın görevi, çıktısı ve <b>konuşması/logları</b> açılır. Üretim ekibi senaryoyu
        kurar, denetçi kurulu onaylar.
      </p>

      <div className="legend">
        <span><i style={{ background: "var(--review)" }} />çalışıyor</span>
        <span><i style={{ background: "var(--good)" }} />geçti</span>
        <span><i style={{ background: "var(--bad)" }} />kaldı / veto</span>
        <span><i style={{ background: "var(--accent)" }} />çalıştı</span>
        <span><i style={{ background: "#3a3f49" }} />beklemede</span>
      </div>

      {job ? (
        <div className="card" style={{ marginBottom: 8 }}>
          <span className="mono" style={{ fontSize: 13 }}>
            Son iş: <b>{job.topic}</b> · aşama <span className="badge">{job.stage}</span>
            {decision && <> · kurul kararı <span className="badge" style={{ color: decision.verdict === "approve" ? "var(--good)" : decision.verdict === "blocked" ? "var(--bad)" : "var(--warn)" }}>{decision.verdict} ({decision.passCount}/{review.reviewerCount})</span></>}
            {live && <> · <span className="badge review">CANLI</span></>}
          </span>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 8, color: "var(--muted)" }}>
          Henüz çalışma yok — ilk pipeline turunda (tick) ajanlar burada canlanacak.
        </div>
      )}

      <h2 style={{ marginTop: 22, fontWeight: 500 }}>Üretim ekibi</h2>
      <p className="tag" style={{ marginTop: -6 }}>Yönetici bir konuyu alt-görevlere böler ve uzmanlara dağıtır.</p>
      <div className="agent-grid">
        {crew.map((a) => <Card key={a.id} a={a} state={crewState[a.id]} />)}
      </div>
      {open && crew.find((a) => a.id === open) && <Detail a={crew.find((a) => a.id === open)!} kind="crew" />}

      <h2 style={{ marginTop: 26, fontWeight: 500 }}>Denetçi kurulu</h2>
      <p className="tag" style={{ marginTop: -6 }}>≥5 bağımsız denetçi senaryoyu puanlar; VETO işaretliler tek başına bloklayabilir.</p>
      <div className="agent-grid">
        {board.map((a) => <Card key={a.id} a={a} state={boardState[a.id]} />)}
      </div>
      {open && board.find((a) => a.id === open) && <Detail a={board.find((a) => a.id === open)!} kind="board" />}

      {!!events.length && (
        <>
          <h2 style={{ marginTop: 30, fontWeight: 500 }}>Son olay kayıtları</h2>
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
