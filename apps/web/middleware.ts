import { NextRequest, NextResponse } from "next/server";

// Private app: gate everything behind a SIGNED session cookie.
// The cookie holds an HMAC token (not the password), so it can't be forged without SESSION_SECRET.
// (Upgrade path: Supabase Auth + allowlist — HANDOFF.md §6.)
const OPEN = ["/login", "/api/login", "/api/health"];

async function expectedToken(): Promise<string> {
  const secret = process.env.SESSION_SECRET || process.env.APP_PASSWORD || "";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("auth-v1"));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (OPEN.some((p) => pathname.startsWith(p)) || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }
  const cookie = req.cookies.get("as_auth")?.value || "";
  if (cookie && safeEqual(cookie, await expectedToken())) return NextResponse.next();
  const url = req.nextUrl.clone(); url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
