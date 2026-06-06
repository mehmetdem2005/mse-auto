import { rag } from "@studio/core";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
export const runtime = "nodejs";

const Body = z.object({
  topic: z.string().min(2),
  text: z.string().min(10),
  source_title: z.string().optional(),
  source_url: z.string().url().optional().or(z.literal("")),
  verified: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const p = Body.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: p.error.flatten() }, { status: 400 });
  const b = p.data;
  try {
    await rag.ingest({
      id: `k_${Date.now()}`, topic: b.topic, text: b.text,
      source_title: b.source_title || "", source_url: b.source_url || "",
      verified: b.verified !== false,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
