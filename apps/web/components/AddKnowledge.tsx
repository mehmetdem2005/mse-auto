"use client";
import { useState } from "react";

export default function AddKnowledge() {
  const [f, setF] = useState({ topic: "", text: "", source_title: "", source_url: "", verified: true });
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    await fetch("/api/knowledge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    location.reload();
  }
  return (
    <div className="card">
      <div className="eyebrow" style={{ marginBottom: 10 }}>Doğrulanmış parça ekle (opsiyonel)</div>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <input placeholder="Konu" value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} />
        <input placeholder="Kaynak başlığı" value={f.source_title} onChange={(e) => setF({ ...f, source_title: e.target.value })} />
      </div>
      <input placeholder="Kaynak URL" style={{ marginTop: 8 }} value={f.source_url} onChange={(e) => setF({ ...f, source_url: e.target.value })} />
      <textarea placeholder="Doğrulanmış olgu metni…" rows={3} style={{ marginTop: 8 }} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} />
      <button className="btn primary" style={{ marginTop: 10 }} disabled={busy || !f.topic || !f.text} onClick={save}>Göm + kaydet</button>
    </div>
  );
}
