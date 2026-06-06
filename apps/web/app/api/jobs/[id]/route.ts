import { db } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
export const runtime = "nodejs";

const Body = z.object({
  action: z.enum(["approve", "reject"]),
  script: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = Body.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: p.error.flatten() }, { status: 400 });
  const { action, script } = p.data;
  const patch: any = {};
  if (script) patch.script = script;
  if (action === "approve") { patch.stage = "approved"; patch.next_run_at = new Date().toISOString(); patch.last_error = null; }
  else { patch.stage = "failed"; patch.last_error = "Rejected by reviewer"; }
  const { error } = await db.from("video_jobs").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
