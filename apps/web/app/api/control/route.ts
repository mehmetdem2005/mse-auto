import { control } from "@studio/core";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
export const runtime = "nodejs";

const Body = z.object({
  action: z.enum(["pause", "resume", "mode"]),
  reason: z.string().optional(),
  mode: z.enum(["run", "draft_only", "dry_run"]).optional(),
});

export async function POST(req: NextRequest) {
  const p = Body.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: p.error.flatten() }, { status: 400 });
  const b = p.data;
  if (b.action === "pause") await control.pause(b.reason || "manual");
  else if (b.action === "resume") await control.resume();
  else if (b.action === "mode" && b.mode) await control.setMode(b.mode);
  return NextResponse.json({ ok: true });
}
