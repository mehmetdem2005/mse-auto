import { NextResponse } from "next/server";
export const runtime = "nodejs";

// Triggers one pipeline pass on the worker (research → draft → review board → needs_review).
// The worker runs on Render free tier, so it may cold-start; we don't block on it.
export async function POST() {
  const url = process.env.WORKER_URL;
  const token = process.env.WORKER_TOKEN;
  if (!url || !token) {
    return NextResponse.json({ ok: false, error: "WORKER_URL / WORKER_TOKEN ayarlı değil." }, { status: 500 });
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    const r = await fetch(`${url.replace(/\/$/, "")}/tick`, {
      method: "POST",
      headers: { "x-worker-token": token },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    const body = await r.json().catch(() => ({}));
    return NextResponse.json({ ok: true, ...body });
  } catch {
    // Cold start / slow: the tick still runs on the worker in the background.
    return NextResponse.json({ ok: true, cold: true, note: "Worker uyanıyor olabilir — üretim birazdan başlar." });
  }
}
