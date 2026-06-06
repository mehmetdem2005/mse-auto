"use client";
import { useState } from "react";
import ReviewBoard from "./ReviewBoard";

export default function ApprovalCard({ job }: { job: any }) {
  const s = job.script || {};
  const [hook, setHook] = useState(s.hook || "");
  const [commentary, setCommentary] = useState(s.commentary || "");
  const [narration, setNarration] = useState(s.narrationText || "");
  const [busy, setBusy] = useState(false);

  async function act(action: "approve" | "reject") {
    setBusy(true);
    const script = { ...s, hook, commentary, narrationText: narration };
    await fetch(`/api/jobs/${job.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, script }),
    });
    location.reload();
  }

  return (
    <div className="job">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3>{s.title || job.topic}</h3>
        <span className="badge review">inceleme bekliyor</span>
      </div>

      {job.last_error && <div className="tag" style={{ color: "var(--warn)", marginBottom: 8 }}>⚠ {job.last_error}</div>}

      <ReviewBoard review={job.review} />

      <label className="eyebrow">Hook (ilk 2 sn)</label>
      <input value={hook} onChange={(e) => setHook(e.target.value)} />

      <div className="beats" style={{ marginTop: 12 }}>
        {(s.beats || []).map((b: string, i: number) => <div key={i}>• {b}</div>)}
        {s.payoff && <div style={{ color: "var(--ink)", marginTop: 6 }}>↳ {s.payoff}</div>}
      </div>

      <label className="eyebrow">Senin özgün açın / yorumun (zorunlu)</label>
      <textarea rows={3} value={commentary} onChange={(e) => setCommentary(e.target.value)} />

      <label className="eyebrow" style={{ display: "block", marginTop: 12 }}>Seslendirme metni (TTS'e gider)</label>
      <textarea rows={4} value={narration} onChange={(e) => setNarration(e.target.value)} />

      <div className="tag" style={{ margin: "10px 0" }}>
        Kaynaklar: {(s.sources || []).map((x: any) => x.title).join(", ") || "—"} · Stil: {s.styleId}
      </div>

      <div className="row">
        <button className="btn primary" disabled={busy} onClick={() => act("approve")}>Onayla → üret</button>
        <button className="btn ghost" disabled={busy} onClick={() => act("reject")}>Reddet</button>
      </div>
    </div>
  );
}
