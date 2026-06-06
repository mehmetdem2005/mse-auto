"use client";
import { useRef, useState } from "react";

type S = "idle" | "running" | "done" | "err";

export default function RunNow({ initialReview = 0 }: { initialReview?: number }) {
  const [state, setState] = useState<S>("idle");
  const [msg, setMsg] = useState("");
  const baseline = useRef(initialReview);

  async function run() {
    setState("running");
    setMsg("Üretim başlatılıyor… (worker uyanıyor olabilir)");
    try {
      const r = await fetch("/api/run", { method: "POST" });
      const d = await r.json();
      if (!d.ok) { setState("err"); setMsg(d.error || "Başlatılamadı."); return; }
      setMsg("Çalışıyor… ajanlar senaryoyu hazırlıyor. Bu free tier'da ~1-3 dk sürebilir.");
      // Poll status until a new "needs_review" draft appears.
      for (let i = 0; i < 18; i++) {
        await new Promise((res) => setTimeout(res, 10000));
        try {
          const s = await fetch("/api/status").then((x) => x.json());
          const nr = s?.stageCounts?.needs_review ?? 0;
          if (nr > baseline.current) {
            setState("done");
            setMsg("✓ Taslak hazır! 'Kuyruk / Onay' sekmesinden inceleyip onayla. Ajanların çalışmasını 'Ajanlar' sekmesinde gör.");
            return;
          }
          setMsg(`Çalışıyor… (${(i + 1) * 10}sn) — ajanlar araştırıp yazıyor, denetçiler puanlıyor.`);
        } catch { /* keep waiting */ }
      }
      setState("done");
      setMsg("Üretim sürüyor. Birkaç dakika içinde 'Kuyruk / Onay' sekmesinde görünecek (sayfayı yenile).");
    } catch {
      setState("err");
      setMsg("Ağ hatası — tekrar dene.");
    }
  }

  const color = state === "err" ? "var(--bad)" : state === "done" ? "var(--good)" : "var(--muted)";
  return (
    <div className="card" style={{ marginBottom: 22, borderColor: "var(--accent-dim)" }}>
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Tek tuşla üretim</div>
          <div style={{ fontSize: 15 }}>Yeni bir Short taslağı ürettir — ajanlar araştırır, yazar ve denetler; sonra senin onayına gelir.</div>
        </div>
        <button className="btn primary" disabled={state === "running"} onClick={run} style={{ fontSize: 15, padding: "12px 22px" }}>
          {state === "running" ? "⏳ Çalışıyor…" : "▶ Şimdi Çalıştır"}
        </button>
      </div>
      {msg && <div className="tag" style={{ marginTop: 12, color, lineHeight: 1.5 }}>{msg}{state === "done" && <> · <a href="/queue" style={{ color: "var(--accent)" }}>Kuyruğa git →</a></>}</div>}
    </div>
  );
}
