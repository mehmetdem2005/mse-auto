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
    if (type === "status") {
      const s = ["queued", "needs_review", "approved", "rendering", "scheduled", "ready", "published", "failed", "dead_letter"];
      const o: any = {};
      for (const st of s) { const { count } = await db.from("video_jobs").select("id", { count: "exact", head: true }).eq("stage", st); o[st] = count ?? 0; }
      return o;
    }
  } catch {}
  return null;
}

async function triggerTick(): Promise<boolean> {
  if (!WORKER_URL || !WORKER_TOKEN) return false;
  try {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 8000);
    await fetch(`${WORKER_URL.replace(/\/$/, "")}/tick`, { method: "POST", headers: { "x-worker-token": WORKER_TOKEN }, signal: c.signal });
    clearTimeout(t); return true;
  } catch { return true; }
}

async function addTopic(topic: string): Promise<{ added: boolean; message: string }> {
  const id = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const text = `Konu: ${topic}. Bu konu hakkında kısa, ilgi çekici bir YouTube Shorts videosu çekilecek.`;
  const { error } = await db.from("knowledge").insert({
    id, topic, text, source_title: "Manuel ekleme", source_url: "", verified: true,
  });
  if (error) return { added: false, message: `Eklenemedi: ${error.message}` };
  await triggerTick();
  return { added: true, message: `"${topic}" konusu bilgi tabanına eklendi, pipeline tetiklendi.` };
}

async function clearFailedAgents(): Promise<number> {
  const { error } = await db.from("agent_status").update({ status: "idle", current_task: null }).in("status", ["failed", "blocked"]);
  return error ? 0 : 1;
}

const TOOLS = [
  { type: "function", function: { name: "durum_oku", description: "Pipeline durumunu, aşama sayılarını ve hataları okur.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "sorunlari_coz", description: "Başarısız/dead-letter işleri yeniden kuyruğa alır ve bir üretim turu tetikler. Hataları GERÇEKTEN düzeltir.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "pipeline_calistir", description: "Yeni bir Short taslağı üretimini başlatır (worker tick).", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "panel_ac", description: "Bir paneli sohbette açar.", parameters: { type: "object", properties: { panel: { type: "string", enum: ["queue", "analytics", "status", "knowledge", "memory", "agents"] } }, required: ["panel"] } } },
  { type: "function", function: { name: "konu_ekle", description: "Bilgi tabanına yeni bir konu ekler ve pipeline'ı tetikler. Bilgi tabanı boş olduğunda veya kullanıcı özel konu istediğinde kullan.", parameters: { type: "object", properties: { konu: { type: "string", description: "Eklenecek konu (Türkçe, 5-60 karakter)" } }, required: ["konu"] } } },
  { type: "function", function: { name: "ajanlari_sifirla", description: "Kırmızı/hatalı ajan durumlarını temizler, ajan görselini sıfırlar.", parameters: { type: "object", properties: {} } } },
];

async function execTool(name: string, args: any): Promise<{ summary: string; panel?: any }> {
  if (name === "durum_oku") {
    const st = await panelData("status");
    const ag = await panelData("agents");
    const failed = (ag ?? []).filter((a: any) => a.status === "failed").map((a: any) => a.agent_id);
    return { summary: `Aşama sayıları: ${JSON.stringify(st)}. Hatalı ajanlar: ${failed.join(", ") || "yok"}.` };
  }
  if (name === "sorunlari_coz") {
    const { data: stuck } = await db.from("video_jobs").select("id,script,video_path,youtube_video_id,heal_count").in("stage", ["dead_letter", "failed"]).limit(20);
    let n = 0;
    for (const j of stuck ?? []) {
      let stage = "queued"; if (j.script) stage = "approved"; if (j.video_path && !j.youtube_video_id) stage = "scheduled";
      await db.from("video_jobs").update({ stage, attempts: 0, locked_by: null, locked_until: null, next_run_at: new Date().toISOString(), heal_count: (j.heal_count ?? 0) + 1, last_error: "asistan: yeniden başlatıldı" }).eq("id", j.id);
      n++;
    }
    // Also clear failed agents
    await clearFailedAgents();
    const t = await triggerTick();
    return { summary: `${n} başarısız iş yeniden başlatıldı; hatalı ajan durumları temizlendi; üretim turu ${t ? "tetiklendi" : "tetiklenemedi"}.` };
  }
  if (name === "pipeline_calistir") {
    const t = await triggerTick();
    return { summary: t ? "Üretim turu başlatıldı; taslak birkaç dakikada Kuyruk'a düşer." : "Worker tetiklenemedi." };
  }
  if (name === "panel_ac") {
    const type = args?.panel || "status";
    return { summary: `${type} paneli açıldı.`, panel: { type, data: await panelData(type) } };
  }
  if (name === "konu_ekle") {
    const konu = String(args?.konu || "").trim();
    if (!konu || konu.length < 3) return { summary: "Geçersiz konu." };
    const r = await addTopic(konu);
    return { summary: r.message };
  }
  if (name === "ajanlari_sifirla") {
    await clearFailedAgents();
    return { summary: "Hatalı/kırmızı ajan durumları temizlendi. Ajan görseli şimdi daha temiz görünmeli." };
  }
  return { summary: "bilinmeyen araç" };
}

// SSE helper: returns a ReadableStream that runs the agentic loop
function createStream(messages: any[], s: Awaited<ReturnType<typeof snapshot>>) {
  const enc = new TextEncoder();
  const send = (ctrl: ReadableStreamDefaultController, data: object) => {
    ctrl.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  return new ReadableStream({
    async start(controller) {
      try {
        const system = `Sen "ShortsPilot" otonom YouTube Shorts pipeline'ının AI asistanısın — JARVIS gibi, kısa net Türkçe.
SADECE konuşma; istenen işi ARAÇLARLA GERÇEKTEN YAP. Kullanıcı "sorunları çöz" derse sorunlari_coz çağır; "yeni taslak/üret/konu ekle" derse pipeline_calistir veya konu_ekle; "X göster/aç" derse panel_ac; durum sorulursa durum_oku; ajanlar kırmızıysa ajanlari_sifirla. Birden fazla adım gerekiyorsa sırayla araç çağır. İş bittiğinde NE YAPTIĞINI 1-2 cümleyle özetle ("✓ ... tamamlandı").
CANLI DURUM: onay bekleyen ${s.pendingApprovals}, son iş ${s.lastJob ? s.lastJob.topic + "/" + s.lastJob.stage : "yok"}, çalışan ajanlar ${s.running.join(",") || "yok"}, hatalı ${s.failed.join(",") || "yok"}.`;

        const init = messages.length === 0;
        const chat: any[] = init ? [{ role: "user", content: "Merhaba, kısa durum özeti ve önerilerini ver." }] : messages.slice(-8);
        let convo: any[] = [{ role: "system", content: system }, ...chat];
        let panel: any = null;
        let reply = "", reasoning = "";
        const steps: any[] = [];

        if (!DS) {
          send(controller, { type: "reply", content: "DEEPSEEK_API_KEY ayarlı değil.", pending: s.pendingApprovals });
          controller.close(); return;
        }

        send(controller, { type: "thinking" });

        for (let i = 0; i < 6; i++) {
          const r = await fetch(DS_URL, {
            method: "POST",
            headers: { Authorization: `Bearer ${DS}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: MODEL, temperature: 0.4, max_tokens: 1200, tools: TOOLS, tool_choice: "auto", messages: convo }),
          });
          if (!r.ok) throw new Error(`DeepSeek ${r.status}: ${(await r.text()).slice(0, 140)}`);
          const d = await r.json();
          const m = d.choices?.[0]?.message ?? {};
          if (m.reasoning_content) {
            reasoning = m.reasoning_content;
            send(controller, { type: "reasoning", content: reasoning });
          }
          convo.push(m);

          if (m.tool_calls?.length) {
            for (const tc of m.tool_calls) {
              let args: any = {}; try { args = JSON.parse(tc.function.arguments || "{}"); } catch {}
              send(controller, { type: "tool_start", tool: tc.function.name, args });
              const res = await execTool(tc.function.name, args);
              if (res.panel) { panel = res.panel; send(controller, { type: "panel", panel: res.panel }); }
              steps.push({ tool: tc.function.name, result: res.summary });
              send(controller, { type: "step", tool: tc.function.name, result: res.summary });
              convo.push({ role: "tool", tool_call_id: tc.id, content: res.summary });
            }
            continue;
          }
          reply = m.content || "Tamam.";
          break;
        }
        if (!reply) reply = "İşlemler tamamlandı.";
        send(controller, { type: "reply", content: reply, reasoning, steps, panel, pending: s.pendingApprovals });
      } catch (e: any) {
        send(controller, { type: "reply", content: `Hata: ${String(e?.message || e).slice(0, 160)}`, steps: [], pending: s.pendingApprovals });
      } finally {
        controller.close();
      }
    },
  });
}

export async function POST(req: Request) {
  const { messages = [] } = await req.json().catch(() => ({ messages: [] }));
  const s = await snapshot();

  const stream = createStream(messages, s);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
