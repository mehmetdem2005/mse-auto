"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Msg = { role: "user" | "assistant"; content: string };

export default function Assistant() {
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sugs, setSugs] = useState<string[]>([]);
  const [pending, setPending] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);
  useEffect(() => { send("", true); /* proactive greeting */ }, []); // eslint-disable-line

  async function exec(action: any) {
    if (!action) return;
    if (action.type === "navigate" && action.to) setTimeout(() => router.push(action.to), 600);
    if (action.type === "run") { fetch("/api/run", { method: "POST" }).catch(() => {}); }
  }

  async function send(text: string, init = false) {
    if (busy) return;
    const history = init ? [] : [...msgs, { role: "user" as const, content: text }];
    if (!init) setMsgs(history);
    setInput(""); setBusy(true); setSugs([]);
    try {
      const r = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history }) });
      const d = await r.json();
      setMsgs((m) => [...(init ? [] : m), { role: "assistant", content: d.reply || "…" }]);
      setSugs(d.suggestions || []); setPending(d.pending ?? 0);
      exec(d.action);
    } catch { setMsgs((m) => [...m, { role: "assistant", content: "Bağlantı hatası — tekrar dene." }]); }
    finally { setBusy(false); }
  }

  return (
    <>
      <div className="console-bar">
        <span className="cb-l">◆ JARVIS</span>
        <span className="cb-c">Asistan</span>
        <span className="cb-r" style={{ color: pending ? "var(--amber)" : "var(--accent)" }}>{pending ? `● ${pending} ONAY BEKLİYOR` : "● HAZIR"}</span>
      </div>

      <div className="chat">
        {msgs.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>{m.content}</div>
        ))}
        {busy && <div className="bubble assistant typing"><span /><span /><span /></div>}
        <div ref={endRef} />
      </div>

      {!!sugs.length && (
        <div className="chips">
          {sugs.map((s, i) => <button key={i} className="chip" onClick={() => send(s)}>{s}</button>)}
        </div>
      )}

      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); if (input.trim()) send(input.trim()); }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Asistana yaz: 'kuyruğu aç', 'yeni taslak üret', 'durum ne?'…" autoFocus />
        <button className="btn primary" disabled={busy || !input.trim()} type="submit">Gönder</button>
      </form>
    </>
  );
}
