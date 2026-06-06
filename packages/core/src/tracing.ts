/**
 * Agent tracing aligned to the OpenTelemetry GenAI semantic conventions.  [v0.6]
 *
 * Research (2026): the #1 agent antipattern is missing observability; the emerging standard is
 * OTel GenAI semconv — spans with `gen_ai.*` attributes (operation.name = invoke_agent /
 * generate_content / execute_tool, request.model, usage.input_tokens/output_tokens). Each tool
 * call / LLM call / sub-agent becomes a child span, producing a full trace of the reasoning chain.
 *
 * We emit spans into the existing job_events trail (type='span') shaped to those conventions, so a
 * thin OTel exporter can later forward them to Langfuse / Jaeger / Grafana Tempo / Datadog with no
 * app changes. Per the conventions, large content goes in events (we keep only attributes + ids),
 * avoiding PII in span attributes. Best-effort: tracing never throws and never blocks the pipeline.
 */
import { supabase } from "./supabase.js";
import { log } from "./logger.js";

const rid = (p: string) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
export const newTraceId = () => rid("trace");
export const newSpanId = () => rid("span");

export interface SpanCtx { traceId: string; parentSpanId?: string; jobId?: string; enabled?: boolean; }

export async function emitSpan(
  ctx: SpanCtx, operation: string, name: string,
  attributes: Record<string, unknown>, durationMs: number,
  status: "OK" | "ERROR" = "OK", spanId = newSpanId(),
) {
  if (!ctx || ctx.enabled === false) return;
  try {
    await supabase.from("job_events").insert({
      job_id: ctx.jobId ?? null, trace_id: ctx.traceId ?? null, type: "span", duration_ms: durationMs,
      data: { span_id: spanId, parent_span_id: ctx.parentSpanId ?? null, "gen_ai.operation.name": operation, name, status, ...attributes },
    });
  } catch (e) { log.debug("span emit failed", { err: String(e) }); }
}

/** Wrap an async unit as a span; `fn` receives a child context so nested spans chain correctly. */
export async function withSpan<T>(
  ctx: SpanCtx, operation: string, name: string,
  attributes: Record<string, unknown>, fn: (child: SpanCtx) => Promise<T>,
): Promise<T> {
  if (!ctx || ctx.enabled === false) return fn(ctx);
  const spanId = newSpanId();
  const start = Date.now();
  const child: SpanCtx = { ...ctx, parentSpanId: spanId };
  try {
    const out = await fn(child);
    await emitSpan(ctx, operation, name, attributes, Date.now() - start, "OK", spanId);
    return out;
  } catch (e: any) {
    await emitSpan(ctx, operation, name, { ...attributes, error: String(e?.message || e) }, Date.now() - start, "ERROR", spanId);
    throw e;
  }
}
