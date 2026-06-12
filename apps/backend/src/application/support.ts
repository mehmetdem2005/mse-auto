import type { AdminRepository } from "../domain/billing";
import type { DeviceRepository } from "../domain/device";
import type { Logger } from "../domain/logger";
import type { Notifier } from "../domain/notifier";
import type { SupportKind, SupportRepository, SupportTicketRow } from "../domain/support";

export interface CreateSupportDeps {
  support: SupportRepository;
  admin: AdminRepository;
  devices: DeviceRepository;
  notifier: Notifier;
  logger: Logger;
}

/**
 * Destek talebi açar; CANLI taleplerde tüm adminlerin cihazlarına push gönderir
 * (ADR-044). Bildirim hatası talebi DÜŞÜRMEZ — loglanır (best-effort fan-out).
 */
export async function createSupportTicket(
  deps: CreateSupportDeps,
  userId: string,
  kind: SupportKind,
  message: string,
): Promise<SupportTicketRow> {
  const ticket = await deps.support.createTicket(userId, kind, message);

  if (kind === "live") {
    try {
      const adminIds = await deps.admin.listAdminIds();
      const preview = message.length > 80 ? `${message.slice(0, 77)}…` : message;
      for (const adminId of adminIds) {
        if (adminId === userId) continue; // kendi talebine bildirim gitmesin
        const tokens = await deps.devices.listTokens(adminId);
        for (const token of tokens) {
          await deps.notifier.send({
            token,
            title: "Canlı destek talebi",
            body: preview,
            data: { type: "support", ticketId: ticket.id },
          });
        }
      }
    } catch (err) {
      deps.logger.warn("destek bildirimi gönderilemedi", {
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return ticket;
}
