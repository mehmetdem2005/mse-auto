import { metrics } from "@studio/core";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
// Readiness + machine-readable metrics (for monitors/alerts).
export async function GET() {
  try {
    const m = await metrics.getMetrics();
    const healthy = !m.overBudget && m.errorRate24h < 0.5;
    return NextResponse.json({ healthy, ...m }, { status: healthy ? 200 : 503 });
  } catch (e: any) {
    return NextResponse.json({ healthy: false, error: String(e?.message || e) }, { status: 503 });
  }
}
