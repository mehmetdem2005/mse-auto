"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

type Roster = { id: string; title: string; description: string; critical?: boolean };
type Feed = {
  roster: { crew: Roster[]; board: Roster[] };
  status: Record<string, { status: string; task: string; updated_at: string }>;
  job: { topic: string; stage: string; updated_at: string } | null;
  review: any;
  trace: any[];
  resources: any;
};

const LABEL: Record<string, string> = { run: "çalışıyor", pass: "geçti", fail: "kaldı / veto", ran: "çalıştı", idle: "beklemede" };
// per-agent line icons (24x24, stroked) — matches the design references' node glyphs
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
const lineColor = (s: string) => s === "run" ? "rgba(34,211,238,.95)" : s === "pass" ? "rgba(70,211,154,.6)" : s === "fail" ? "rgba(255,93,93,.6)" : s === "ran" ? "rgba(255,176,46,.55)" : "rgba(34,211,238,.22)";
const place = (i: number, n: number, r: number) => { const a = (-90 + (i * 360) / n) * (Math.PI / 180); return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) }; };
const fresh = (t: string) => Date.now() - new Date(t).getTime() < 10 * 60_000;
const liveCls = (s: string) => (s === "running" || s === "planning" || s === "waiting" || s === "needs_user_approval") ? "run" : s === "completed" ? "ran" : (s === "failed" || s === "blocked") ? "fail" : "idle";

export default function AgentBoard() {
  const [d, setD] = useState<Feed | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const [tab, setTab] = useState<"core" | "sys" | "active" | "log">("core");
  const router = useRouter();
  const [vState, setVState] = useState<"off" | "listening" | "thinking" | "speaking">("off");
  const [heard, setHeard] = useState("");
  const [said, setSaid] = useState("");
  const recRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onRef = useRef(false);
  const speakingRef = useRef(false);

  useEffect(() => () => { onRef.current = false; try { recRef.current?.stop(); } catch {} try { audioRef.current?.pause(); } catch {} }, []);

  function speak(text: string): Promise<void> {
    return new Promise(async (resolve) => {
      try {
        const r = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
        if (!r.ok) return resolve();
        const a = new Audio(URL.createObjectURL(await r.blob())); audioRef.current = a;
        a.onended = () => resolve(); a.onerror = () => resolve();
        a.play().catch(() => resolve());
      } catch { resolve(); }
    });
  }
  async function handleUtterance(text: string) {
    if (!text.trim()) return;
    try { recRef.current?.stop(); } catch {}
    setVState("thinking"); setHeard(text);
    let reply = "", action: any = null;
    try {
      const r = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: text }] }) });
      const j = await r.json(); reply = j.reply || "…"; action = j.action;
    } catch { reply = "Bağlantı hatası."; }
    setSaid(reply);
    if (action?.type === "navigate" && action.to) setTimeout(() => router.push(action.to), 1000);
    if (action?.type === "run") fetch("/api/run", { method: "POST" }).catch(() => {});
    setVState("speaking"); speakingRef.current = true;
    await speak(reply);
    speakingRef.current = false;
    if (onRef.current) { setVState("listening"); try { recRef.current?.start(); } catch {} } else setVState("off");
  }
  function startVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Tarayıcın sürekli sesli dinlemeyi desteklemiyor — Chrome öner."); return; }
    const rec = new SR(); recRef.current = rec;
    rec.lang = "tr-TR"; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e: any) => {
      let interim = "", final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) final += t; else interim += t; }
      if (interim) setHeard(interim);
      if (final.trim() && !speakingRef.current) handleUtterance(final.trim());
    };
    rec.onend = () => { if (onRef.current && !speakingRef.current) { try { rec.start(); } catch {} } };
    rec.onerror = () => {};
    onRef.current = true; setVState("listening"); setSaid("Dinliyorum, konuş…");
    try { rec.start(); } catch {}
  }
  function stopVoice() { onRef.current = false; try { recRef.current?.stop(); } catch {} try { audioRef.current?.pause(); } catch {} setVState("off"); }

  useEffect(() => {
    let on = true;
    const tick = async () => {
      try { const r = await fetch("/api/agents", { cache: "no-store" }); const j = await r.json(); if (on) { setD(j); setErr(false); } }
      catch { if (on) setErr(true); }
    };
    tick(); const iv = setInterval(tick, 4000);
    return () => { on = false; clearInterval(iv); };
  }, []);

  const crew = d?.roster.crew ?? [];
  const board = d?.roster.board ?? [];
  const review = d?.review;
  const verdicts: any[] = review?.verdicts ?? [];
  const crewLog: any[] = review?.crew ?? [];
  const decision = review?.decision ?? null;
  const res = d?.resources ?? {};

  // resolve each agent's display status: live agent_status first, else last-run review, else idle
  const statusOf = (id: string, group: "crew" | "board") => {
    const live = d?.status?.[id];
    if (live && fresh(live.updated_at)) return { cls: liveCls(live.status), task: live.task, live: true };
    if (group === "board") { const v = verdicts.find((x) => x.role === id); if (v) return { cls: v.pass ? "pass" : "fail", task: `puan ${v.score}`, live: false }; }
    else { const l = crewLog.find((x) => x.role === id); if (l) return { cls: l.ok === false ? "fail" : "ran", task: l.goal || "", live: false }; }
    return { cls: "idle", task: "", live: false };
  };

  const crewPos = crew.map((a, i) => ({ a, kind: "crew" as const, s: statusOf(a.id, "crew"), ...place(i, crew.length || 1, 31) }));
  const boardPos = board.map((a, i) => ({ a, kind: "board" as const, s: statusOf(a.id, "board"), ...place(i, board.length || 1, 47) }));
  const all = [...crewPos, ...boardPos];

  const autoFocus = useMemo(() => {
    const run = all.find((p) => p.s.cls === "run"); if (run) return run.a.id;
    const fail = all.find((p) => p.s.cls === "fail"); if (fail) return fail.a.id;
    return all.find((p) => p.s.cls === "ran" || p.s.cls === "pass")?.a.id ?? null;
  }, [d]);
  const sel = open ?? autoFocus;
  const selNode = all.find((p) => p.a.id === sel);
  const count = (c: string) => all.filter((p) => p.s.cls === c).length;
  const live = !!res.live;
  const health = Math.max(0, Math.round((1 - (res.errorRate24h ?? 0)) * 100));
  const GC = 2 * Math.PI * 36; const goff = GC * (1 - health / 100);

  let ticks: any[] = [];
  for (let k = 0; k < 72; k++) { const a = (k * 5) * Math.PI / 180; const big = k % 6 === 0; ticks.push({ x1: 50 + (big ? 46.5 : 47.6) * Math.cos(a), y1: 50 + (big ? 46.5 : 47.6) * Math.sin(a), x2: 50 + 49 * Math.cos(a), y2: 50 + 49 * Math.sin(a), o: big ? 0.5 : 0.22 }); }

  function detail(node: NonNullable<typeof selNode>) {
    const { a, kind, s } = node;
    const v = kind === "board" ? verdicts.find((x) => x.role === a.id) : null;
    const log = kind === "crew" ? crewLog.find((x) => x.role === a.id) : null;
    const cls = s.cls === "pass" ? "good" : s.cls === "fail" ? "bad" : s.cls === "run" ? "review" : "";
    return (
      <>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
          <span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{a.title}</span>
          <span className={`badge ${cls}`}>{LABEL[s.cls]}</span>
        </div>
        <div className="arole" style={{ marginBottom: 8 }}>{a.id}{a.critical ? " · VETO" : ""}</div>
        {s.task && <div className="tag" style={{ marginBottom: 8 }}>▸ {s.task}</div>}
        <p className="desc" style={{ fontSize: 13 }}>{a.description}</p>
        {v && (
          <div className="convo"><span className="who">{a.title}:</span>{"\n"}
            {(v.issues?.length ? v.issues : ["— sorun bildirmedi —"]).map((x: string) => `• ${x}`).join("\n")}
            {v.required_fixes?.length ? `\n\nİstenen düzeltmeler:\n${v.required_fixes.map((x: string) => `→ ${x}`).join("\n")}` : ""}
          </div>
        )}
        {log && <div className="convo"><span className="who">{a.title}:</span>{"\n"}{log.error ? `⚠ ${log.error}` : (typeof log.output === "string" ? log.output : JSON.stringify(log.output, null, 2)) || "— çıktı yok —"}</div>}
        {!v && !log && <div className="tag" style={{ marginTop: 8 }}>Bu ajan henüz veri üretmedi; bir tur dönünce burada görünür.</div>}
      </>
    );
  }

  const Bar = ({ k, v, pct, c }: { k: string; v: string; pct: number; c?: string }) => (
    <div style={{ marginBottom: 9 }}>
      <div className="row" style={{ justifyContent: "space-between" }}><span className="k" style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#6e93a6", letterSpacing: ".06em", textTransform: "uppercase" }}>{k}</span><span className="mono" style={{ fontSize: 12, color: "#a7ecf7" }}>{v}</span></div>
      <div style={{ height: 5, background: "#0c2230", borderRadius: 3, marginTop: 3, overflow: "hidden" }}><div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: c || "var(--cy)", boxShadow: `0 0 8px ${c || "var(--cy)"}` }} /></div>
    </div>
  );

  return (
    <>
      <div className="console-bar">
        <span className="cb-l">◆ AI PIPELINE MANAGER</span>
        <span className="cb-c">Ajan Kontrol Merkezi</span>
        <span className="row" style={{ gap: 10 }}>
          <button className={`chip voice-btn v-${vState}`} onClick={() => (vState === "off" ? startVoice() : stopVoice())}>
            {vState === "off" ? "🎙 Sesli Asistan" : vState === "listening" ? "● Dinliyor…" : vState === "thinking" ? "… Düşünüyor" : "🔊 Konuşuyor"}
          </button>
          <span className="cb-r" style={{ color: live ? "var(--cy)" : "#5fd0e6" }}>{live ? "● AKTİF" : err ? "● YOK" : "○ BEKLE"}</span>
        </span>
      </div>

      <div className="holo-tabs">
        {([["core", "Çekirdek"], ["sys", "Sistem"], ["active", "Aktif Ajan"], ["log", "Canlı Log"]] as const).map(([t, l]) => (
          <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>

      <div className="holo-root" data-tab={tab}>
      <div className="holo-stage">
        {/* SOL — sistem + kaynak monitörü */}
        <div className="holo-panel tabpane tp-sys">
          <div className="eyebrow">Sistem Durumu</div>
          <div className="gauge-wrap">
            <svg className="gauge" viewBox="0 0 84 84">
              <circle cx="42" cy="42" r="36" fill="none" stroke="#0c2230" strokeWidth="7" />
              <circle cx="42" cy="42" r="36" fill="none" stroke={health > 70 ? "var(--cy)" : health > 40 ? "var(--accent)" : "var(--bad)"} strokeWidth="7" strokeLinecap="round" strokeDasharray={GC.toFixed(1)} strokeDashoffset={goff.toFixed(1)} transform="rotate(-90 42 42)" style={{ filter: "drop-shadow(0 0 4px var(--cy))" }} />
              <text className="gv" x="42" y="47" textAnchor="middle">{health}%</text>
            </svg>
            <div><div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#bdeffb" }}>Pipeline Sağlığı</div><div className="tag" style={{ marginTop: 4 }}>{live ? "üretim aktif" : "sistem nominal"}</div></div>
          </div>
          <div className="holo-stat"><span className="k">Durum</span><span className="v" style={{ color: live ? "var(--cy)" : "#a7ecf7" }}>{live ? "● CANLI" : "○ HAZIR"}</span></div>
          <div className="holo-stat"><span className="k">Toplam ajan</span><span className="v">{crew.length + board.length}</span></div>
          <div className="holo-stat"><span className="k">Çalışan</span><span className="v">{count("run")}</span></div>
          <div className="holo-stat"><span className="k">Tamam / geçti</span><span className="v">{count("ran") + count("pass")}</span></div>
          <div className="holo-stat"><span className="k">Hata / veto</span><span className="v">{count("fail")}</span></div>
          <div className="holo-stat"><span className="k">Son aşama</span><span className="v">{d?.job?.stage ?? "—"}</span></div>
          <div className="holo-stat"><span className="k">Kurul</span><span className="v">{decision ? `${decision.verdict} ${decision.passCount}/${review.reviewerCount}` : "—"}</span></div>
          <div className="eyebrow" style={{ margin: "16px 0 10px" }}>Kaynak Monitörü</div>
          <Bar k="Bütçe (gün)" v={`$${(res.usdToday ?? 0).toFixed(2)} / $${res.usdCap ?? 5}`} pct={((res.usdToday ?? 0) / (res.usdCap || 5)) * 100} />
          <Bar k="Hata oranı 24s" v={`${Math.round((res.errorRate24h ?? 0) * 100)}%`} pct={(res.errorRate24h ?? 0) * 100} c="var(--bad)" />
          <Bar k="Kuyruk" v={`${res.queue ?? 0}`} pct={(res.queue ?? 0) * 20} c="var(--accent)" />
          <Bar k="YouTube kotası" v={`${res.youtubeUnitsToday ?? 0}`} pct={((res.youtubeUnitsToday ?? 0) / 8000) * 100} c="var(--good)" />
        </div>

        {/* ORTA — hologram */}
        <div className="holo tabpane tp-core">
          <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
          <div className="holo-ring r2" /><div className="holo-ring r3" /><div className="holo-ring r1" /><div className="holo-sweep" />
          <svg className="holo-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs><filter id="g" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.7" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
            <g filter="url(#g)">
              <circle cx="50" cy="50" r="31" fill="none" stroke="rgba(34,211,238,.5)" strokeWidth="0.45" />
              <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(34,211,238,.16)" strokeWidth="0.3" />
              {ticks.map((t, i) => <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={`rgba(34,211,238,${t.o})`} strokeWidth="0.3" />)}
              {all.map((p) => <line key={p.a.id} x1="50" y1="50" x2={p.x} y2={p.y} stroke={lineColor(p.s.cls)} strokeWidth={sel === p.a.id ? 0.8 : 0.45} className={p.s.cls === "run" || sel === p.a.id ? "holo-flow" : ""} />)}
              {all.filter((p) => p.s.cls === "run" || sel === p.a.id).map((p) => <circle key={"e" + p.a.id} className="energy" cx={50 + (p.x - 50) * 0.6} cy={50 + (p.y - 50) * 0.6} r={0.7} />)}
            </g>
          </svg>
          <div className={`holo-core ${live || vState !== "off" ? "alive" : ""} v-${vState}`}>
            <span className="hc-state">AI CORE</span>
            <span className="hc-sub">{vState === "listening" ? "● DİNLİYOR" : vState === "thinking" ? "… DÜŞÜNÜYOR" : vState === "speaking" ? "🔊 KONUŞUYOR" : live ? "● ÇALIŞIYOR" : "● ONLINE"}</span>
          </div>
          {vState !== "off" && (heard || said) && (
            <div className="holo-sub">
              {heard && <div className="hs-user">“{heard}”</div>}
              {said && <div className="hs-ai">{said}</div>}
            </div>
          )}
          {all.map((p) => (
            <button key={p.a.id} type="button" className={`holo-node ag-${p.s.cls} ${sel === p.a.id ? "sel" : ""}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }} onClick={() => setOpen(sel === p.a.id ? null : p.a.id)} title={`${p.a.title} — ${LABEL[p.s.cls]}`}>
              <span className="orb"><svg viewBox="0 0 24 24"><path d={ic(p.a.id)} /></svg></span>
              <span className="nlabel">{p.a.title}</span>
            </button>
          ))}
        </div>

        {/* SAĞ — aktif ajan */}
        <div className="holo-panel tabpane tp-active">
          <div className="eyebrow">Aktif Ajan</div>
          <AnimatePresence mode="wait">
            <motion.div key={sel || "none"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
              {selNode ? detail(selNode) : <div className="tag">{d ? "Bir ajana dokun → görevi ve logu açılır." : "Yükleniyor…"}</div>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="legend tabpane tp-core" style={{ justifyContent: "center" }}>
        <span><i style={{ background: "var(--cy)" }} />çalışıyor</span><span><i style={{ background: "var(--good)" }} />geçti</span>
        <span><i style={{ background: "var(--bad)" }} />kaldı / veto</span><span><i style={{ background: "var(--accent)" }} />çalıştı</span>
        <span><i style={{ background: "#3a3f49" }} />beklemede</span>
      </div>

      {/* Execution trace — canlı log akışı */}
      <div className="tabpane tp-log">
        <h2 style={{ marginTop: 26 }}>Yürütme İzi (canlı)</h2>
        <div className="holo-panel" style={{ maxHeight: 300, overflow: "auto", padding: 0 }}>
          <table style={{ border: "none", background: "none" }}>
            <tbody>
              {(d?.trace ?? []).map((ev, i) => (
                <tr key={i}>
                  <td className="mono" style={{ color: "#5a7c8c", fontSize: 11, whiteSpace: "nowrap" }}>{new Date(ev.created_at).toLocaleTimeString()}</td>
                  <td><span className="badge">{ev.type}</span></td>
                  <td className="mono" style={{ fontSize: 11, color: "#7fa8ba" }}>{ev.stage ?? "—"}</td>
                  <td className="mono" style={{ color: "var(--muted)", fontSize: 11 }}>{ev.data?.message || ev.data?.reason || ev.data?.topic || ""}</td>
                </tr>
              ))}
              {!d?.trace?.length && <tr><td className="tag" style={{ padding: 14 }}>Henüz olay yok — bir tur dönünce loglar buraya akacak.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </>
  );
}
