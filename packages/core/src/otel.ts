/**
 * OpenTelemetry OTLP/HTTP exporter — forwards our gen_ai.* spans to any OTel backend.  [v0.9]
 * Maps job_events(type='span') → OTLP JSON and POSTs to OTEL_EXPORTER_OTLP_ENDPOINT (/v1/traces).
 * Backends: Langfuse / Jaeger / Grafana Tempo / Datadog. (IDs are best-effort hex-normalized.)
 */
import { supabase } from "./supabase.js";
import { log } from "./logger.js";

const hex = (s: string, len: number) => (String(s || "").replace(/[^a-f0-9]/gi, "").toLowerCase() + "0".repeat(len)).slice(0, len);

export function toOtlp(spans: any[]) {
  return {
    resourceSpans: [{
      resource: { attributes: [{ key: "service.name", value: { stringValue: "auto-shorts-studio" } }] },
      scopeSpans: [{
        scope: { name: "studio.agents" },
        spans: spans.map((s) => {
          const d = s.data || {};
          const attributes = Object.entries(d)
            .filter(([k]) => k.startsWith("gen_ai.") || ["name", "status"].includes(k))
            .map(([k, v]) => ({ key: k, value: { stringValue: String(v) } }));
          return {
            traceId: hex(s.trace_id, 32), spanId: hex(d.span_id, 16),
            parentSpanId: d.parent_span_id ? hex(d.parent_span_id, 16) : undefined,
            name: d.name || d["gen_ai.operation.name"] || "span", kind: 3, attributes,
          };
        }),
      }],
    }],
  };
}

export async function exportSpans(limit = 200, fetchImpl: any = (globalThis as any).fetch): Promise<{ exported: number }> {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return { exported: 0 };
  try {
    const { data } = await supabase.from("job_events").select("*").eq("type", "span").order("created_at", { ascending: false }).limit(limit);
    const r = await fetchImpl(endpoint.replace(/\/$/, "") + "/v1/traces", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(toOtlp(data || [])) });
    return { exported: r.ok ? (data?.length || 0) : 0 };
  } catch (e) { log.debug("otel export failed", { err: String(e) }); return { exported: 0 }; }
}
