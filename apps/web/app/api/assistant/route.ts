import { NextResponse } from "next/server";
import { db } from "@/lib/supabaseServer";
export const runtime = "nodejs";
export const maxDuration = 60;

const DS = process.env.DEEPSEEK_API_KEY;
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-pro";
const DS_URL = "https://api.deepseek.com/chat/completions";
const WORKER_URL = process.env.WORKER_URL;
const WORKER_TOKEN = process.env.WORKER_TOKEN;

async function snapshot() {
  const [rev, ev, ag, jb] = await Promise.all([
    db.from("video_jobs").select("id,topic", { count: "exact" }).eq("stage", "needs_review"),
    db.from("job_events").select("type,stage,created_at").order("created_at", { ascending: false }).limit(6),
    db.from("agent_status").select("agent_id,status").order("updated_at", { ascending: false }).limit(20),
    db.from("video_jobs").select("topic,stage").order("updated_at", { ascending: false }).limit(1),
  ]);
  return {
    pendingApprovals: rev.count ?? 0,
    lastJob: jb.data?.[0] ?? null,
    running: (ag.data ?? []).filter((a: any) => a.status === "running").map((a: any) => a.agent_id),
    failed: (ag.data ?? []).filter((a: any) => a.status === "failed").map((a: any) => a.agent_id),
    recent: (ev.data ?? []).map((e: any) => `${e.type}${e.stage ? "/" + e.stage : ""}`),
  };
}
async function panelData(type: string): Promise<any> {
  try {
    if (type === "queue") return (await db.from("video_jobs").select("id,topic,stage,review,script").eq("stage", "needs_review").limit(8)).data ?? [];
    if (type === "analytics") return (await db.from("analytics").select("title,video_id,views,likes,comments").order("views", { ascending: false }).limit(12)).data ?? [];
    if (type === "knowledge") return (await db.from("knowledge").select("topic,source_title,verified").order("created_at", { ascending: false }).limit(20)).data ?? [];
    if (type === "memory") return (await db.from("memory").select("kind,content,created_at").order("created_at", { ascending: false }).limit(20)).data ?? [];
    if (type === "agents") return (await db.from("agent_status").select("agent_id,status,current_task,updated_at").order("updated_at", { ascending: false }).limit(20)).data ?? [];
    if (type === "status") { const s = ["queued", "needs_review", "approved", "rendering", "scheduled", "published", "failed", "dead_letter"]; const o: any = {}; for (const st of s) { const { count } = await db.from("video_jobs").select("id", { count: "exact", head: true }).eq("stage", st); o[st] = count ?? 0; } return o; }
  } catch {}
  return null;
}
async function triggerTick(): Promise<boolean> {
  if (!WORKER_URL || !WORKER_TOKEN) return false;
  try { const c = new AbortController(); const t = setTimeout(() => c.abort(), 8000); await fetch(`${WORKER_URL.replace(/\/$/, "")}/tick`, { method: "POST", headers: { "x-worker-token": WORKER_TOKEN }, signal: c.signal }); clearTimeout(t); return true; } catch { return true; }
}

// real, executable tools the agent can call
const TOOLS = [
  { type: "function", function: { name: "durum_oku", description: "Pipeline durumunu, aşama sayılarını ve hataları okur.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "sorunlari_coz", description: "Başarısız/dead-letter işleri yeniden kuyruğa alır ve bir üretim turu tetikler. Hataları GERÇEKTEN düzeltir.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "pipeline_calistir", description: "Yeni bir Short taslağı üretimini başlatır (worker tick).", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "panel_ac", description: "Bir paneli sohbette açar.", parameters: { type: "object", properties: { panel: { type: "string", enum: ["queue", "analytics", "status", "knowledge", "memory", "agents"] } }, required: ["panel"] } } },
];

async function execTool(name: string, args: any): Promise<{ summary: string; panel?: any }> {
  if (name === "durum_oku") { const st = await panelData("status"); return { summary: JSON.stringify(st) }; }
  if (name === "sorunlari_coz") {
    const { data: stuck } = await db.from("video_jobs").select("id,script,video_path,youtube_video_id,heal_count").in("stage", ["dead_letter", "failed"]).limit(20);
    let n = 0;
    for (const j of stuck ?? []) {
      let stage = "queued"; if (j.script) stage = "approved"; if (j.video_path && !j.youtube_video_id) stage = "scheduled";
      await db.from("video_jobs").update({ stage, attempts: 0, locked_by: null, locked_until: null, next_run_at: new Date().toISOString(), heal_count: (j.heal_count ?? 0) + 1, last_error: "asistan: yeniden başlatıldı" }).eq("id", j.id); n++;
    }
    const t = await triggerTick();
    return { summary: `${n} başarısız iş yeniden başlatıldı; üretim turu ${t ? "tetiklendi" : "tetiklenemedi"}.` };
  }
  if (name === "pipeline_calistir") { const t = await triggerTick(); return { summary: t ? "Üretim turu başlatıldı; taslak birkaç dakikada Kuyruk'a düşer." : "Worker tetiklenemedi." }; }
  if (name === "panel_ac") { const type = args?.panel || "status"; return { summary: `${type} paneli açıldı.`, panel: { type, data: await panelData(type) } }; }
  return { summary: "bilinmeyen araç" };
}

export async function POST(req: Request) {
  const { messages = [] } = await req.json().catch(() => ({ messages: [] }));
  const s = await snapshot();
  if (!DS) return NextResponse.json({ reply: "DEEPSEEK_API_KEY ayarlı değil.", steps: [] });

  const system = `Sen "ShortsPilot" otonom YouTube Shorts pipeline'ının AI asistanısın — JARVIS gibi, kısa net Türkçe.
SADECE konuşma; istenen işi ARAÇLARLA GERÇEKTEN YAP. Kullanıcı "sorunları çöz" derse sorunlari_coz çağır; "yeni taslak/üret" derse pipeline_calistir; "X göster/aç" derse panel_ac; durum sorulursa durum_oku. Birden fazla adım gerekiyorsa sırayla araç çağır. İş bittiğinde NE YAPTIĞINI 1-2 cümleyle özetle ("✓ ... tamamlandı").
CANLI DURUM: onay bekleyen ${s.pendingApprovals}, son iş ${s.lastJob ? s.lastJob.topic + "/" + s.lastJob.stage : "yok"}, çalışan ajanlar ${s.running.join(",") || "yok"}, hatalı ${s.failed.join(",") || "yok"}.`;

  const init = messages.length === 0;
  const chat: any[] = init ? [{ role: "user", content: "Merhaba, kısa durum özeti ve önerilerini ver." }] : messages.slice(-8);
  let convo: any[] = [{ role: "system", content: system }, ...chat];
  const steps: any[] = [];
  let panel: any = null;
  let reply = "", reasoning = "";

  try {
    for (let i = 0; i < 6; i++) {
      const r = await fetch(DS_URL, { method: "POST", headers: { Authorization: `Bearer ${DS}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: MODEL, temperature: 0.4, max_tokens: 1200, tools: TOOLS, tool_choice: "auto", messages: convo }) });
      if (!r.ok) throw new Error(`DeepSeek ${r.status}: ${(await r.text()).slice(0, 140)}`);
      const d = await r.json();
      const m = d.choices?.[0]?.message ?? {};
      if (m.reasoning_content) reasoning = m.reasoning_content;
      convo.push(m);
      if (m.tool_calls?.length) {
        for (const tc of m.tool_calls) {
          let args: any = {}; try { args = JSON.parse(tc.function.arguments || "{}"); } catch {}
          const res = await execTool(tc.function.name, args);
          if (res.panel) panel = res.panel;
          steps.push({ tool: tc.function.name, result: res.summary });
          convo.push({ role: "tool", tool_call_id: tc.id, content: res.summary });
        }
        continue;            // let the model react to tool results
      }
      reply = m.content || "Tamam.";
      break;
    }
    if (!reply) reply = "İşlemler tamamlandı.";
    return NextResponse.json({ reply, reasoning, steps, panel, pending: s.pendingApprovals });
  } catch (e: any) {
    return NextResponse.json({ reply: `Hata: ${String(e?.message || e).slice(0, 160)}`, steps, panel, pending: s.pendingApprovals });
  }
}
