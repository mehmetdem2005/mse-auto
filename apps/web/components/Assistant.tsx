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
  const [voiceOn, setVoiceOn] = useState(true);
  const [listening, setListening] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recRef = useRef<any>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);
  useEffect(() => { send("", true); return () => { try { recRef.current?.stop(); audioRef.current?.pause(); } catch {} }; }, []); // eslint-disable-line

  // Premium voice out (OpenAI onyx) — never Google TTS.
  async function speak(text: string) {
    if (!voiceOn || !text) return;
    try {
      audioRef.current?.pause();
      const r = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      if (!r.ok) return;
      const url = URL.createObjectURL(await r.blob());
      const a = new Audio(url); audioRef.current = a; a.play().catch(() => {});
    } catch {}
  }

  function listen() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Tarayıcın sesli girişi desteklemiyor (Chrome öner)."); return; }
    if (listening) { try { recRef.current?.stop(); } catch {}; return; }
    const rec = new SR(); recRef.current = rec;
    rec.lang = "tr-TR"; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e: any) => { const t = e.results[0][0].transcript; setInput(t); send(t); };
    rec.start();
  }

  async function exec(action: any) {
    if (!action) return;
    if (action.type === "navigate" && action.to) setTimeout(() => router.push(action.to), 700);
    if (action.type === "run") fetch("/api/run", { method: "POST" }).catch(() => {});
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
      speak(d.reply); exec(d.action);
    } catch { setMsgs((m) => [...m, { role: "assistant", content: "Bağlantı hatası — tekrar dene." }]); }
    finally { setBusy(false); }
  }

  return (
    <>
      <div className="console-bar">
        <span className="cb-l">◆ JARVIS</span>
        <span className="cb-c">Asistan</span>
        <span className="row" style={{ gap: 10 }}>
          <button className="chip" style={{ padding: "5px 11px" }} onClick={() => setVoiceOn((v) => !v)}>{voiceOn ? "🔊 Ses açık" : "🔇 Ses kapalı"}</button>
          <span className="cb-r" style={{ color: pending ? "var(--amber)" : "var(--accent)" }}>{pending ? `● ${pending} ONAY` : "● HAZIR"}</span>
        </span>
      </div>

      <div className="chat">
        {msgs.map((m, i) => <div key={i} className={`bubble ${m.role}`}>{m.content}</div>)}
        {busy && <div className="bubble assistant typing"><span /><span /><span /></div>}
        <div ref={endRef} />
      </div>

      {!!sugs.length && <div className="chips">{sugs.map((s, i) => <button key={i} className="chip" onClick={() => send(s)}>{s}</button>)}</div>}

      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); if (input.trim()) send(input.trim()); }}>
        <button type="button" className={`btn mic ${listening ? "on" : ""}`} onClick={listen} title="Sesle konuş">{listening ? "● dinliyor" : "🎤"}</button>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Yaz ya da 🎤 ile konuş: 'kuyruğu aç', 'yeni taslak üret', 'durum ne?'…" autoFocus />
        <button className="btn primary" disabled={busy || !input.trim()} type="submit">Gönder</button>
      </form>
    </>
  );
}
