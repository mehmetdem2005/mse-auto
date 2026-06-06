import { db } from "@/lib/supabaseServer";
import { crew, agents } from "@studio/core";
import AgentBoard from "@/components/AgentBoard";

export const dynamic = "force-dynamic";

// Live agent control room. Shows the production crew + the editorial review board.
// Each agent glows by its status in the most recent pipeline run; click to open its
// description, output/deliberation ("conversation") and related event logs.
export default async function AgentsPage() {
  const { data: jobs } = await db
    .from("video_jobs")
    .select("id,topic,stage,review,updated_at,last_error")
    .order("updated_at", { ascending: false })
    .limit(1);
  const job = jobs?.[0] ?? null;
  const review = job?.review ?? null;

  const { data: events } = job
    ? await db.from("job_events").select("type,stage,data,created_at,duration_ms").eq("job_id", job.id).order("created_at", { ascending: false }).limit(40)
    : { data: [] as any[] };

  const crewRoster = crew.ROLES.map((r) => ({ id: r.id, title: r.title, description: r.system }));
  const boardRoster = agents.REVIEWERS_META.map((r) => ({ id: r.id, title: r.title, description: r.description, critical: r.critical }));

  const activeStages = ["queued", "drafting", "approved", "rendering", "scheduled", "uploading"];
  const liveMs = job ? Date.now() - new Date(job.updated_at).getTime() : Infinity;
  const live = Boolean(job && activeStages.includes(job.stage) && liveMs < 120_000);

  return (
    <AgentBoard
      crew={crewRoster}
      board={boardRoster}
      review={review}
      job={job ? { topic: job.topic, stage: job.stage, updated_at: job.updated_at } : null}
      events={events ?? []}
      live={live}
    />
  );
}
