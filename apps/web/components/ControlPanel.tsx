"use client";
import { useState } from "react";

export default function ControlPanel({ paused, mode }: { paused: boolean; mode: string; reason: string | null }) {
  const [busy, setBusy] = useState(false);
  async function call(body: any) {
    setBusy(true);
    await fetch("/api/control", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    location.reload();
  }
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="eyebrow" style={{ marginBottom: 12 }}>Control plane</div>
      <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
        {paused ? (
          <button className="btn primary" disabled={busy} onClick={() => call({ action: "resume" })}>▶ Resume</button>
        ) : (
          <button className="btn" disabled={busy} onClick={() => call({ action: "pause", reason: "manual" })}>⏸ Pause (kill switch)</button>
        )}
        <span className="tag" style={{ alignSelf: "center" }}>mode:</span>
        {["run", "draft_only", "dry_run"].map((md) => (
          <button key={md} className={`btn ${mode === md ? "primary" : "ghost"}`} disabled={busy} onClick={() => call({ action: "mode", mode: md })}>{md}</button>
        ))}
      </div>
      <div className="tag" style={{ marginTop: 10 }}>
        Pause halts all production/upload instantly — nothing is lost, jobs wait. draft_only = research+draft but never auto-publish. dry_run = no new work.
      </div>
    </div>
  );
}
