"use client";
import { useEffect, useMemo, useRef, useState } from "react";

// ── single-page command center: orbiting agents on top, chat (with inline panels) below,
//    always-on voice via OpenAI Whisper (STT) + OpenAI onyx (TTS). No Google speech. ──

const ICON: Record<string, string> = {
  manager: "M12 2l9 5v10l-9 5-9-5V7z", trend_scout: "M3 17l6-6 4 4 8-8M21 7v4h-4",
  competitor_analyst: "M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z", hook_writer: "M13 2L3 14h7l-1 8 10-12h-7z",
  scriptwriter: "M4 20l3-1L18 8l-3-3L4 16z", packaging: "M3 5h18v14H3zM3 16l5-5 4 4 3-2 6 5",
  compliance: "M12 2l8 3v6c0 5-4 9-8 11-4-2-8-6-8-11V5z", analyst: "M4 20V11M10 20V4M16 20v-6M20 20H2",
  module_auditor: "M12 2l9 5v10l-9 5-9-5V7zM12 12l9-5M12 12v10", tool_developer: "M14 7a4 4 0 01-5 5l-6 6 3 3 6-6a4 4 0 005-5z",
  self_improve_engineer: "M20 12a8 8 0 11-2.3-5.7M20 4v4h-4", accuracy: "M20 6L9 17l-5-5",
  policy: "M12 2l8 3v6c0 5-4 9-8 11-4-2-8-6-8-11V5zM9 12l2 2 4-4", copyright: "M12 2a10 10 0 100 20 10 10 0 000-20zM15 9a4 4 0 100 6",
  editorial: "M7 7h6M7 11h8M7 15h5M4 3h16v18l-3-2-3 2-3-2-3 2-1-1z", retention: "M6 4l14 8-14 8z",
  language: "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2c3 4 3 16 0 20M12 2c-3 4-3 16 0 20",
};
const ic = (id: string) => ICON[id] || "M12 2l9 5v10l-9 5-9-5V7z";
const lineColor = (s: string) => s === "run" ? "rgba(0,217,255,.95)" : s === "pass" ? "rgba(0,240,168,.6)" : s === "fail" ? "rgba(255,59,69,.6)" : s === "ran" ? "rgba(255,138,28,.55)" : "rgba(0,217,255,.22)";
const place = (i: number, n: number, r: number) => { const a = (-90 + (i * 360) / n) * (Math.PI / 180); return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) }; };
const fresh = (t: string) => Date.now() - new Date(t).getTime() < 10 * 60_000;
const liveCls = (s: string) => (s === "running" || s === "planning" || s === "waiting" || s === "needs_user_approval") ? "run" : s === "completed" ? "ran" : (s === "failed" || s === "blocked") ? "fail" : "idle";

type Msg = { role: "user" | "assistant"; content: string; reasoning?: string; steps?: { tool: string; result: string }[] } | { role: "panel"; panel: { type: string; data: any } };
const TOOL_LABEL: Record<string, string> = { durum_oku: "Durum okundu", sorunlari_coz: "Sorunlar çözüldü", pipeline_calistir: "Üretim tetiklendi", panel_ac: "Panel açıldı" };

export default function AgentBoard() {
  const [feed, setFeed] = useState<any>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [sugs, setSugs] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [vState, setVState] = useState<"off" | "listening" | "thinking" | "speaking">("off");
  const [heard, setHeard] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onRef = useRef(false);
  const speakingRef = useRef(false);
  const mediaRef = useRef<{ stream: MediaStream; rec: MediaRecorder; ctx: AudioContext } | null>(null);

  // poll live agent states for the holo
  useEffect(() => {
    let on = true;
    const t = async () => { try { const r = await fetch("/api/agents", { cache: "no-store" }); if (on) setFeed(await r.json()); } catch {} };
    t(); const iv = setInterval(t, 4000); return () => { on = false; clearInterval(iv); };
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);
  // persist chat across navigation
  useEffect(() => {
    try { const saved = localStorage.getItem("cc_chat"); if (saved) { const arr = JSON.parse(saved); if (Array.isArray(arr) && arr.length) { setMsgs(arr); return () => stopVoice(); } } } catch {}
    greet(); return () => stopVoice();
  }, []); // eslint-disable-line
  useEffect(() => { try { if (msgs.length) localStorage.setItem("cc_chat", JSON.stringify(msgs.slice(-40))); } catch {} }, [msgs]);

  const crew = feed?.roster?.crew ?? [];
  const board = feed?.roster?.board ?? [];
  const status = feed?.status ?? {};
  const review = feed?.review;
  const res = feed?.resources ?? {};
  const live = !!res.live;

  const statusOf = (id: string, group: string) => {
    const l = status[id];
    if (l && fresh(l.updated_at)) return liveCls(l.status);
    if (group === "board") { const v = (review?.verdicts ?? []).find((x: any) => x.role === id); if (v) return v.pass ? "pass" : "fail"; }
    else { const lg = (review?.crew ?? []).find((x: any) => x.role === id); if (lg) return lg.ok === false ? "fail" : "ran"; }
    return "idle";
  };
  const crewPos = crew.map((a: any, i: number) => ({ a, cls: statusOf(a.id, "crew"), ...place(i, crew.length || 1, 31) }));
  const boardPos = board.map((a: any, i: number) => ({ a, cls: statusOf(a.id, "board"), ...place(i, board.length || 1, 47) }));
  const all = [...crewPos, ...boardPos];
  const ticks = useMemo(() => { const out: any[] = []; for (let k = 0; k < 72; k++) { const a = (k * 5) * Math.PI / 180, big = k % 6 === 0, r1 = big ? 46.5 : 47.6; out.push({ x1: 50 + r1 * Math.cos(a), y1: 50 + r1 * Math.sin(a), x2: 50 + 49 * Math.cos(a), y2: 50 + 49 * Math.sin(a), o: big ? 0.5 : 0.22 }); } return out; }, []);

  // ── voice (Whisper STT + onyx TTS), always-on once started ──
  function speak(text: string): Promise<void> {
    return new Promise(async (resolve) => {
      try {
        const r = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
        if (!r.ok) return resolve();
        const a = new Audio(URL.createObjectURL(await r.blob())); audioRef.current = a;
        a.onended = () => resolve(); a.onerror = () => resolve(); a.play().catch(() => resolve());
      } catch { resolve(); }
    });
  }
  async function transcribe(blob: Blob) {
    if (blob.size < 4000) return;                       // ignore tiny/silent clips (avoids hallucinations)
    setVState("thinking");
    const fd = new FormData(); fd.append("file", blob, "a.webm");
    try { const r = await fetch("/api/stt", { method: "POST", body: fd }); const j = await r.json(); if (j.text) await handleUtterance(j.text); else if (onRef.current) setVState("listening"); }
    catch { if (onRef.current) setVState("listening"); }
  }
  function startVoice() {
    if (vState !== "off") return;
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream); const an = ctx.createAnalyser(); an.fftSize = 512; src.connect(an);
      const buf = new Uint8Array(an.fftSize);
      let rec: MediaRecorder, chunks: Blob[] = [], hadSpeech = false, silence = 0, speechFrames = 0;
      const newRec = () => {
        rec = new MediaRecorder(stream, { mimeType: "audio/webm" }); chunks = []; hadSpeech = false; silence = 0; speechFrames = 0;
        rec.ondataavailable = (e) => chunks.push(e.data);
        rec.onstop = () => { const had = hadSpeech; const blob = new Blob(chunks, { type: "audio/webm" }); if (had) transcribe(blob); if (onRef.current && !speakingRef.current) newRec(); };
        rec.start(); mediaRef.current = { stream, rec, ctx };
      };
      const loop = () => {
        if (!onRef.current) return;
        if (speakingRef.current) { requestAnimationFrame(loop); return; }   // don't record our own TTS
        an.getByteTimeDomainData(buf); let sum = 0; for (const v of buf) { const x = (v - 128) / 128; sum += x * x; }
        const rms = Math.sqrt(sum / buf.length);
        if (rms > 0.05) { speechFrames++; if (speechFrames > 6) hadSpeech = true; silence = 0; }   // need sustained speech
        else if (hadSpeech) { silence += 1; if (silence > 55 && rec && rec.state === "recording") rec.stop(); } // ~0.9s silence → end utterance
        requestAnimationFrame(loop);
      };
      onRef.current = true; setVState("listening"); newRec(); loop();
    }).catch(() => alert("Mikrofon izni gerekli."));
  }
  function stopVoice() {
    onRef.current = false; speakingRef.current = false;
    try { mediaRef.current?.rec.state === "recording" && mediaRef.current?.rec.stop(); } catch {}
    try { mediaRef.current?.stream.getTracks().forEach((t) => t.stop()); mediaRef.current?.ctx.close(); } catch {}
    try { audioRef.current?.pause(); } catch {}
    mediaRef.current = null; setVState("off");
  }

  async function greet() { await converse("", true); }
  async function converse(text: string, init = false) {
    if (busy && !init) return;
    const history = init ? [] : [...msgs.filter((m): m is Extract<Msg, { role: "user" | "assistant" }> => m.role !== "panel"), { role: "user" as const, content: text }];
    if (!init && text) setMsgs((m) => [...m, { role: "user", content: text }]);
    setBusy(true); setSugs([]); setHeard("");
    try {
      const r = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history }) });
      const d = await r.json();
      setMsgs((m) => [...m, { role: "assistant", content: d.reply || "…", reasoning: d.reasoning || "", steps: d.steps || [] }]);
      if (d.panel?.type) setMsgs((m) => [...m, { role: "panel", panel: d.panel }]);
      setSugs(d.suggestions || []);
      if (d.action?.type === "run") fetch("/api/run", { method: "POST" }).catch(() => {});
      // speak
      if (vState !== "off" || onRef.current) { setVState("speaking"); speakingRef.current = true; await speak(d.reply); speakingRef.current = false; if (onRef.current) setVState("listening"); else setVState("off"); }
    } catch { setMsgs((m) => [...m, { role: "assistant", content: "Bağlantı hatası." }]); }
    finally { setBusy(false); }
  }
  async function handleUtterance(text: string) { setHeard(text); await converse(text); }

  return (
    <>
      <div className="console-bar">
        <span className="cb-l">◆ JARVIS</span>
        <span className="cb-c">Komuta Merkezi</span>
        <span className="row" style={{ gap: 10 }}>
          <button className={`chip voice-btn v-${vState}`} onClick={() => (vState === "off" ? startVoice() : stopVoice())}>
            {vState === "off" ? "🎙 Sesi Aç" : vState === "listening" ? "● Dinliyor" : vState === "thinking" ? "… Düşünüyor" : "🔊 Konuşuyor"}
          </button>
          <button className="chip" style={{ padding: "5px 10px" }} title="Sohbeti temizle" onClick={() => { setMsgs([]); try { localStorage.removeItem("cc_chat"); } catch {}; greet(); }}>🗑</button>
          <span className="cb-r" style={{ color: live ? "var(--cy)" : "#5fd0e6" }}>{live ? "● AKTİF" : "○ HAZIR"}</span>
        </span>
      </div>

      {/* orbiting agents */}
      <div className="cc-holo">
        <div className="holo">
          <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
          <div className="holo-ring r2" /><div className="holo-ring r3" /><div className="holo-ring r1" /><div className="holo-sweep" />
          <svg className="holo-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs><filter id="g" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.7" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
            <g filter="url(#g)">
              <circle cx="50" cy="50" r="31" fill="none" stroke="rgba(0,217,255,.5)" strokeWidth="0.45" />
              <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(0,217,255,.16)" strokeWidth="0.3" />
              {ticks.map((t, i) => <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={`rgba(0,217,255,${t.o})`} strokeWidth="0.3" />)}
              {all.map((p: any) => <line key={p.a.id} x1="50" y1="50" x2={p.x} y2={p.y} stroke={lineColor(p.cls)} strokeWidth={0.45} className={p.cls === "run" ? "holo-flow" : ""} />)}
              {all.filter((p: any) => p.cls === "run").map((p: any) => <circle key={"e" + p.a.id} className="energy" cx={50 + (p.x - 50) * 0.6} cy={50 + (p.y - 50) * 0.6} r={0.7} />)}
            </g>
          </svg>
          <div className={`holo-core ${live || vState !== "off" ? "alive" : ""} v-${vState}`}>
            <span className="hc-state">AI CORE</span>
            <span className="hc-sub">{vState === "listening" ? "● DİNLİYOR" : vState === "thinking" ? "… DÜŞÜNÜYOR" : vState === "speaking" ? "🔊 KONUŞUYOR" : live ? "● ÇALIŞIYOR" : "● ONLINE"}</span>
          </div>
          {all.map((p: any) => (
            <div key={p.a.id} className={`holo-node ag-${p.cls}`} style={{ left: `${p.x}%`, top: `${p.y}%`, cursor: "default" }} title={p.a.title}>
              <span className="orb"><svg viewBox="0 0 24 24"><path d={ic(p.a.id)} /></svg></span>
              <span className="nlabel">{p.a.title}</span>
            </div>
          ))}
          {heard && <div className="holo-sub"><div className="hs-user">“{heard}”</div></div>}
        </div>
      </div>

      {/* conversation (panels open inline here) */}
      <div className="cc-chat">
        {msgs.map((m, i) => m.role === "panel" ? <InlinePanel key={i} panel={(m as any).panel} /> : (
          <div key={i} className={`bubble ${m.role}`}>
            {(m as any).reasoning ? <details className="reasoning"><summary>🧠 Düşünce süreci</summary>{(m as any).reasoning}</details> : null}
            {(m as any).steps?.length ? <div className="steps">{(m as any).steps.map((st: any, j: number) => <div key={j} className="step">✓ {TOOL_LABEL[st.tool] || st.tool} — {st.result}</div>)}</div> : null}
            {(m as any).content}
          </div>
        ))}
        {busy && <div className="bubble assistant typing"><span /><span /><span /></div>}
        <div ref={endRef} />
      </div>

      {!!sugs.length && <div className="chips">{sugs.map((s, i) => <button key={i} className="chip" onClick={() => converse(s)}>{s}</button>)}</div>}

      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); if (input.trim()) { const t = input.trim(); setInput(""); converse(t); } }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Yaz ya da 🎙 ile konuş: 'kuyruğu göster', 'analizi aç', 'yeni taslak üret'…" autoFocus />
        <button className="btn primary" disabled={busy || !input.trim()} type="submit">Gönder</button>
      </form>
    </>
  );
}

function InlinePanel({ panel }: { panel: { type: string; data: any } }) {
  const { type, data } = panel;
  const title: Record<string, string> = { queue: "Kuyruk / Onay", analytics: "Analitik", status: "Durum", knowledge: "Bilgi Tabanı", memory: "Hafıza", agents: "Ajan Durumları" };
  return (
    <div className="cc-panel">
      <div className="eyebrow" style={{ marginBottom: 10 }}>▣ {title[type] || type}</div>
      {type === "status" && data && (
        <div className="grid cards" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
          {Object.entries(data).map(([k, v]: any) => <div className="card stat" key={k} style={{ padding: 12 }}><div className="n" style={{ fontSize: 22 }}>{v}</div><div className="l">{k}</div></div>)}
        </div>
      )}
      {type === "queue" && (Array.isArray(data) && data.length ? data.map((j: any) => (
        <div className="card" key={j.id} style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 600 }}>{j.script?.title || j.topic}</div>
          {j.script?.hook && <div className="hook" style={{ fontSize: 14, marginTop: 4 }}>{j.script.hook}</div>}
          <div className="tag" style={{ marginTop: 6 }}>{j.review?.decision ? `kurul: ${j.review.decision.verdict}` : j.stage} · <a href="/queue" style={{ color: "var(--accent)" }}>tam sayfada onayla →</a></div>
        </div>
      )) : <div className="tag">Onay bekleyen yok.</div>)}
      {type === "agents" && (Array.isArray(data) && data.length ? <div className="grid" style={{ gap: 6 }}>{data.map((a: any, i: number) => <div className="row" key={i} style={{ justifyContent: "space-between" }}><span className="mono" style={{ fontSize: 13 }}>{a.agent_id}</span><span className={`badge ${a.status === "completed" ? "good" : a.status === "failed" ? "bad" : a.status === "running" ? "review" : ""}`}>{a.status}</span></div>)}</div> : <div className="tag">Ajan durumu yok.</div>)}
      {type === "knowledge" && (Array.isArray(data) && data.length ? <table><tbody>{data.map((k: any, i: number) => <tr key={i}><td>{k.topic}</td><td className="mono" style={{ color: "var(--muted)" }}>{k.source_title}</td><td><span className={`badge ${k.verified ? "good" : "bad"}`}>{k.verified ? "✓" : "?"}</span></td></tr>)}</tbody></table> : <div className="tag">Boş.</div>)}
      {type === "memory" && (Array.isArray(data) && data.length ? data.slice(0, 12).map((m: any, i: number) => <div className="card" key={i} style={{ padding: "8px 12px", marginBottom: 6 }}><span className="tag">{m.kind}</span> {m.content}</div>) : <div className="tag">Hafıza boş.</div>)}
      {type === "analytics" && (Array.isArray(data) && data.length ? <table><thead><tr><th>Başlık</th><th>İzlenme</th><th>Beğeni</th></tr></thead><tbody>{data.map((r: any, i: number) => <tr key={i}><td>{r.title || r.video_id}</td><td className="mono">{r.views}</td><td className="mono">{r.likes}</td></tr>)}</tbody></table> : <div className="tag">Henüz veri yok — video yayınlayınca dolacak.</div>)}
    </div>
  );
}
