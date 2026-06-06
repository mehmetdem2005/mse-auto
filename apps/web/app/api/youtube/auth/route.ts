export const runtime = "nodejs";
import { youtube } from "@studio/core";
import { NextResponse } from "next/server";

// Step 1: send the user to Google's consent screen.
export async function GET() {
  return NextResponse.redirect(youtube.consentUrl());
}
