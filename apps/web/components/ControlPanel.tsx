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
      <div className="eyebrow" style={{ marginBottom: 12 }}>Kontrol düzlemi</div>
      <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
        {paused ? (
          <button className="btn primary" disabled={busy} onClick={() => call({ action: "resume" })}>▶ Devam et</button>
        ) : (
          <button className="btn" disabled={busy} onClick={() => call({ action: "pause", reason: "manual" })}>⏸ Duraklat (acil durdur)</button>
        )}
        <span className="tag" style={{ alignSelf: "center" }}>mod:</span>
        {["run", "draft_only", "dry_run"].map((md) => (
          <button key={md} className={`btn ${mode === md ? "primary" : "ghost"}`} disabled={busy} onClick={() => call({ action: "mode", mode: md })}>{md}</button>
        ))}
      </div>
      <div className="tag" style={{ marginTop: 10 }}>
        Duraklat tüm üretimi/yüklemeyi anında durdurur — hiçbir şey kaybolmaz, işler bekler. draft_only = araştır+taslak ama asla otomatik yayınlama. dry_run = yeni iş alma.
      </div>
    </div>
  );
}
