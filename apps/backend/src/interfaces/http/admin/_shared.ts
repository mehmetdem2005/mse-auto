import { type RouteConfig, z } from "@hono/zod-openapi";

/**
 * Admin route modülleri arası PAYLAŞILAN yardımcılar (ADR-137 — admin.route.ts modülerleştirme).
 * Her domain modülü kendi rotalarını AYNI app örneğine kaydeder (`register*`); davranış değişmez,
 * yalnız kod domain dosyalarına bölünür.
 */
const okSchema = z.object({ ok: z.boolean() });
export const jsonOk = {
  content: { "application/json": { schema: okSchema } },
  description: "Tamam",
};

/** ADR-104 denetim günlüğü imzası — modüllere param olarak geçilir (container.moderation.writeAudit). */
export type AdminAudit = (
  actorId: string,
  action: string,
  targetType: string,
  targetId?: string | null,
  meta?: Record<string, unknown> | null,
) => Promise<void>;

/** OpenAPI yanıt nesnesi tipi (modüllerde `jsonOk` vb. için). */
export type AdminResponse = RouteConfig["responses"][number];
