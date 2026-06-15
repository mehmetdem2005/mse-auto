import { OpenAPIHono } from "@hono/zod-openapi";
import type { Container } from "../../config/container";
import { registerAiAdminRoutes } from "./admin/ai.route";
import { registerBillingAdminRoutes } from "./admin/billing.route";
import { registerChannelsAdminRoutes } from "./admin/channels.route";
import { registerContentAdminRoutes } from "./admin/content.route";
import { registerSupportAdminRoutes } from "./admin/support.route";
import { registerSystemAdminRoutes } from "./admin/system.route";
import { registerUserAdminRoutes } from "./admin/users.route";
import { registerWatchesAdminRoutes } from "./admin/watches.route";
import type { AuthVariables } from "./auth.middleware";

/**
 * Admin konsol HTTP rotaları (ADR-137 — modülerleştirme / M1 FAZ 1.1-1.4).
 * Bu dosya YALNIZ kompozisyon (mount): her domain kendi `admin/<domain>.route.ts` modülünde
 * rotalarını AYNI app örneğine kaydeder. ADR-104 denetim günlüğü yardımcısı (`audit`) burada
 * tek yerden tanımlanıp YAZMA içeren modüllere (kullanıcı/içerik/kanal) param olarak geçirilir.
 * Davranış, eski 968 satırlık monolit ile BİREBİR aynıdır — saf refactor (testlerle korunur).
 */
export function adminRoutes(container: Container): OpenAPIHono<{ Variables: AuthVariables }> {
  const app = new OpenAPIHono<{ Variables: AuthVariables }>();

  // ADR-104 — denetim günlüğü yardımcısı: sonuç-doğuran admin işlemleri burada izlenir.
  const audit = (
    actorId: string,
    action: string,
    targetType: string,
    targetId: string | null = null,
    meta: Record<string, unknown> | null = null,
  ): Promise<void> =>
    container.moderation.writeAudit({ actorId, action, targetType, targetId, meta });

  // ---- Domain modülleri: her biri rotalarını AYNI app'e kaydeder (sıra eşleşme açısından nötr) ----
  registerSystemAdminRoutes(app, container); // analitik · zaman serisi · trafik · sağlayıcı · ops · büyüme · denetim · sistem
  registerAiAdminRoutes(app, container); // global LLM modeli + gömme/embedding sağlayıcısı
  registerContentAdminRoutes(app, container, audit); // duyuru CRUD + push yayını
  registerBillingAdminRoutes(app, container); // fiyatlar + abonelik + CSV dışa aktarım
  registerUserAdminRoutes(app, container, audit); // kullanıcı liste/detay + eylemler (yetki/sil/hediye/iptal/ban)
  registerChannelsAdminRoutes(app, container, audit); // kanal aç-kapa + e-posta besteci istemi
  registerWatchesAdminRoutes(app, container); // watcher liste/durum/sil/timeline
  registerSupportAdminRoutes(app, container); // destek talepleri

  return app;
}
