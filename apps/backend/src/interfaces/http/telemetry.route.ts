import { OpenAPIHono } from "@hono/zod-openapi";
import { trafficEventInputSchema } from "@watcher/contracts";
import type { Container } from "../../config/container";
import { type TrafficEvent, dayKey } from "../../domain/traffic";

/** Kendi alanlarımız "yönlendiren" sayılmaz (öz-trafik kirliliği önlenir). */
const SELF_HOSTS = new Set(["whenly-site.vercel.app", "watcher-app-inky.vercel.app", "localhost"]);

/** Yönlendiren → yalnız alan adı (www'suz, küçük harf); kendi alanlarımız → null. */
function refHost(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const host = (raw.includes("://") ? new URL(raw).hostname : raw)
      .toLowerCase()
      .replace(/^www\./, "")
      .slice(0, 80);
    if (!host || SELF_HOSTS.has(host)) return null;
    return host;
  } catch {
    return null;
  }
}

function cleanPath(raw: string | undefined): string | null {
  if (!raw) return null;
  const p = ((raw.split("?")[0] ?? "").split("#")[0] ?? "").slice(0, 80);
  return p.startsWith("/") ? p : null;
}

/**
 * POST /t — kimliksiz trafik sinyali (ADR-091). Bilinçli olarak /v1 DIŞINDA:
 * auth zincirine girmez (site ziyaretçisinin hesabı yok). sendBeacon text/plain
 * gönderir (CORS preflight'sız) → gövde elle parse edilir. Her durumda 204:
 * telemetri ucu probe'a bilgi sızdırmaz. Kötüye kullanım: IP başına dakikalık
 * limit (app.ts'te bağlanır).
 */
export function telemetryRoutes(container: Container): OpenAPIHono {
  const app = new OpenAPIHono();
  app.post("/", async (c) => {
    try {
      const parsed = trafficEventInputSchema.safeParse(JSON.parse(await c.req.text()));
      if (parsed.success) {
        const input = parsed.data;
        const event: TrafficEvent = {
          day: dayKey(new Date()), // gün SUNUCUDA hesaplanır (25012 — istemci saati güvenilmez)
          source: input.source,
          ref: refHost(input.ref),
          utm: input.utm?.trim().toLowerCase().slice(0, 40) || null,
          path: cleanPath(input.path),
          lang: input.lang?.trim().toLowerCase().slice(0, 8) || null,
          platform: input.platform ?? null,
        };
        await container.traffic.record(event);
      }
    } catch {
      // Telemetri hatası (bozuk gövde / migration eksik) hizmeti İLGİLENDİRMEZ — sessiz.
    }
    return c.body(null, 204);
  });
  return app;
}
