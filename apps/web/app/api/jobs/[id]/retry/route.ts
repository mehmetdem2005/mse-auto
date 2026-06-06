import { db } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data: job } = await db.from("video_jobs").select("*").eq("id", params.id).single();
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
  // Resume from the furthest completed point.
  let stage = "queued";
  if (job.script) stage = "approved";
  if (job.video_path && !job.youtube_video_id) stage = "scheduled";
  await db.from("video_jobs").update({
    stage, attempts: 0, locked_by: null, locked_until: null,
    next_run_at: new Date().toISOString(), last_error: null,
    scheduled_for: stage === "scheduled" ? new Date().toISOString() : job.scheduled_for,
  }).eq("id", params.id);
  return NextResponse.json({ ok: true, stage });
}
