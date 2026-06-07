import { NextResponse } from "next/server";
import { db } from "@/lib/supabaseServer";
import { crew, agents, metrics } from "@studio/core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Live feed for the AI CORE control center: roster + real per-agent state + execution trace + resources.
export async function GET() {
  const roster = {
    crew: crew.ROLES.map((r) => ({ id: r.id, title: r.title, description: r.system })),
    board: agents.REVIEWERS_META.map((r) => ({ id: r.id, title: r.title, description: r.description, critical: r.critical })),
  };

  const [{ data: st }, { data: jobs }, { data: events }] = await Promise.all([
    db.from("agent_status").select("*"),
    db.from("video_jobs").select("topic,stage,review,updated_at,last_error").order("updated_at", { ascending: false }).limit(1),
    db.from("job_events").select("type,stage,data,created_at").order("created_at", { ascending: false }).limit(30),
  ]);

  const status: Record<string, any> = {};
  for (const s of st ?? []) status[s.agent_id] = { status: s.status, task: s.current_task, updated_at: s.updated_at };

  const job = jobs?.[0] ?? null;
  let m: any = null;
  try { m = await metrics.getMetrics(); } catch { /* ignore */ }
  const sc = m?.stageCounts ?? {};
  const queue = ["queued", "drafting", "needs_review", "approved", "rendering", "scheduled", "uploading"].reduce((a, k) => a + (sc[k] ?? 0), 0);

  // any agent updated & running in the last 2 min → live
  const recentRun = (st ?? []).some((s: any) => s.status === "running" && Date.now() - new Date(s.updated_at).getTime() < 120_000);

  return NextResponse.json({
    roster,
    status,
    job: job ? { topic: job.topic, stage: job.stage, updated_at: job.updated_at } : null,
    review: job?.review ?? null,
    trace: events ?? [],
    resources: {
      live: recentRun,
      usdToday: m?.usdToday ?? 0,
      usdCap: Number(process.env.DAILY_USD_CAP ?? 5),
      errorRate24h: m?.errorRate24h ?? 0,
      youtubeUnitsToday: m?.youtubeUnitsToday ?? 0,
      queue,
      published24h: m?.published24h ?? 0,
      deadLetter: m?.deadLetter ?? 0,
    },
  });
}
