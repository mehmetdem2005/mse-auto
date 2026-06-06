import { NextResponse } from "next/server";
export const runtime = "nodejs";
// Liveness: cheap, no DB. For uptime monitors.
export async function GET() { return NextResponse.json({ ok: true, ts: new Date().toISOString() }); }
