import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
export const runtime = "nodejs";

function sessionToken(): string {
  const secret = process.env.SESSION_SECRET || process.env.APP_PASSWORD || "";
  return createHmac("sha256", secret).update("auth-v1").digest("hex");
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const pw = String(form.get("password") || "");
  if (!process.env.APP_PASSWORD || pw !== process.env.APP_PASSWORD) {
    const url = req.nextUrl.clone(); url.pathname = "/login"; url.searchParams.set("e", "1");
    return NextResponse.redirect(url);
  }
  const res = NextResponse.redirect(new URL("/", req.url));
  // Store the SIGNED token, never the raw password.
  res.cookies.set("as_auth", sessionToken(), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
