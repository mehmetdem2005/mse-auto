export const runtime = "nodejs";
import { db } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const num = (k: string) => Number(form.get(k));
  const patch = {
    timezone: String(form.get("timezone") || "Europe/Istanbul"),
    seed: num("seed") || 1337,
    daytimeStartHour: num("daytimeStartHour") || 9,
    daytimeEndHour: num("daytimeEndHour") || 21,
    maxPerDay: num("maxPerDay") || 2,
    minSpacingMinutes: num("minSpacingMinutes") || 150,
    requireHumanApproval: form.get("requireHumanApproval") === "on",
  };
  await db.from("config").update(patch).eq("id", 1);
  return NextResponse.redirect(new URL("/settings", req.url));
}
