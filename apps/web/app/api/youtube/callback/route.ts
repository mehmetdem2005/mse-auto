export const runtime = "nodejs";
import { youtube } from "@studio/core";
import { NextRequest, NextResponse } from "next/server";

// Step 2: Google redirects back here with ?code=… — exchange it for a refresh token and store it.
export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/settings?yt=error", req.url));
  try {
    const ok = await youtube.exchangeCodeAndStore(code);
    return NextResponse.redirect(new URL(ok ? "/settings?yt=connected" : "/settings?yt=norefresh", req.url));
  } catch {
    return NextResponse.redirect(new URL("/settings?yt=error", req.url));
  }
}
