import type { AdminAuditRow, AuditEntry, ModerationRepository } from "../../domain/moderation";

/** Dev/in-memory moderasyon — bellekte ban kümesi + denetim listesi (kalıcı değil). */
export class InMemoryModerationRepository implements ModerationRepository {
  private readonly banned = new Set<string>();
  private readonly audit: AdminAuditRow[] = [];

  async isBanned(userId: string): Promise<boolean> {
    return this.banned.has(userId);
  }

  async setBanned(userId: string, banned: boolean): Promise<void> {
    if (banned) this.banned.add(userId);
    else this.banned.delete(userId);
  }

  async writeAudit(entry: AuditEntry): Promise<void> {
    this.audit.unshift({
      id: `aud_${this.audit.length + 1}`,
      actorId: entry.actorId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId ?? null,
      meta: entry.meta ?? null,
      createdAt: new Date().toISOString(),
    });
  }

  async listAudit(limit: number): Promise<AdminAuditRow[]> {
    return this.audit.slice(0, limit);
  }
}
