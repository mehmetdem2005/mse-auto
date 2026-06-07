import { NextResponse } from "next/server";
import { db } from "@/lib/supabaseServer";
export const runtime = "nodejs";

const GROQ = process.env.GROQ_API_KEY;
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

// Live snapshot the assistant reasons over (so it isn't a hollow chatbot).
async function snapshot() {
  const [rev, ev, ag, jb] = await Promise.all([
    db.from("video_jobs").select("id,topic", { count: "exact" }).eq("stage", "needs_review"),
    db.from("job_events").select("type,stage,created_at").order("created_at", { ascending: false }).limit(6),
    db.from("agent_status").select("agent_id,status").order("updated_at", { ascending: false }).limit(20),
    db.from("video_jobs").select("topic,stage").order("updated_at", { ascending: false }).limit(1),
  ]);
  const running = (ag.data ?? []).filter((a: any) => a.status === "running").map((a: any) => a.agent_id);
  const failed = (ag.data ?? []).filter((a: any) => a.status === "failed").map((a: any) => a.agent_id);
  return {
    pendingApprovals: rev.count ?? 0,
    pendingTopics: (rev.data ?? []).map((r: any) => r.topic).slice(0, 3),
    lastJob: jb.data?.[0] ?? null,
    running, failed,
    recent: (ev.data ?? []).map((e: any) => `${new Date(e.created_at).toLocaleTimeString()} ${e.type}${e.stage ? "/" + e.stage : ""}`),
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
      const stages = ["queued", "needs_review", "approved", "rendering", "scheduled", "published", "failed", "dead_letter"];
      const out: Record<string, number> = {};
      for (const st of stages) { const { count } = await db.from("video_jobs").select("id", { count: "exact", head: true }).eq("stage", st); out[st] = count ?? 0; }
      return out;
    }
  } catch { /* ignore */ }
  return null;
}

export async function POST(req: Request) {
  const { messages = [] } = await req.json().catch(() => ({ messages: [] }));
  const s = await snapshot();
  if (!GROQ) return NextResponse.json({ reply: "Asistan LLM anahtarı (GROQ_API_KEY) ayarlı değil.", action: { type: "none" } });

  const system = `Sen "ShortsPilot" otonom YouTube Shorts pipeline'ının AI asistanısın — JARVIS gibi, kısa ve net Türkçe konuş.
Görevin: kullanıcıya yardım et, öner, arka plan durumunu özetle, onay gerekiyorsa söyle, ve gerektiğinde panelleri aç.
CANLI DURUM:
- Onay bekleyen taslak: ${s.pendingApprovals} ${s.pendingTopics.length ? "(" + s.pendingTopics.join(", ") + ")" : ""}
- Son iş: ${s.lastJob ? s.lastJob.topic + " · " + s.lastJob.stage : "yok"}
- Çalışan ajanlar: ${s.running.join(", ") || "yok"} | Hata/veto: ${s.failed.join(", ") || "yok"}
- Son olaylar: ${s.recent.join(" · ") || "yok"}
Sayfalar: / (panel), /queue (onay), /agents (ajan kontrol merkezi), /knowledge, /memory, /analytics, /observability (izleme), /lab, /settings.
SADECE şu JSON şemasıyla yanıt ver: {"reply":"...","action":{"type":"none|panel|run","panel":"queue|analytics|status|knowledge|memory|agents"},"suggestions":["kısa öneri", ...]}
- action.type="panel" → ilgili paneli SOHBETİN İÇİNDE açar (sayfa değiştirmeden). Kullanıcı "kuyruğu aç/göster", "analizi göster", "durum", "bilgi tabanı", "hafıza", "ajanlar" gibi şeyler derse uygun panel'i seç.
- action.type="run" → yeni taslak üretimini başlat. "none" → sadece konuş.
- suggestions: tek tıkla seçilebilecek 2-3 kısa eylem (örn. "Kuyruğu göster", "Analizi göster", "Yeni taslak üret").
- Onay bekleyen iş varsa MUTLAKA belirt ve panel:"queue" öner.`;

  const init = messages.length === 0;
  const chat = init
    ? [{ role: "user", content: "Merhaba, durum nedir? Kısa özet ve önerilerini ver." }]
    : messages.slice(-10);

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, temperature: 0.5, max_tokens: 700, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, ...chat] }),
    });
    if (!r.ok) throw new Error(`Groq ${r.status}: ${(await r.text()).slice(0, 160)}`);
    const d = await r.json();
    let out: any = {};
    try { out = JSON.parse(d.choices?.[0]?.message?.content ?? "{}"); } catch { out = { reply: d.choices?.[0]?.message?.content ?? "" }; }
    let panel: any = null;
    if (out.action?.type === "panel" && out.action.panel) panel = { type: out.action.panel, data: await panelData(out.action.panel) };
    return NextResponse.json({
      reply: out.reply || "…",
      action: out.action || { type: "none" },
      panel,
      suggestions: Array.isArray(out.suggestions) ? out.suggestions.slice(0, 4) : [],
      pending: s.pendingApprovals,
    });
  } catch (e: any) {
    return NextResponse.json({ reply: `Asistan hatası: ${String(e?.message || e).slice(0, 160)}`, action: { type: "none" }, suggestions: [], pending: s.pendingApprovals });
  }
}
