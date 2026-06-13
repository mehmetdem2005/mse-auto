/** Denetim günlüğü satırı (ADR-104) — değiştirilemez (salt-ekleme). */
export interface AdminAuditRow {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

/** Yeni denetim kaydı girişi. */
export interface AuditEntry {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  meta?: Record<string, unknown> | null;
}

/**
 * Moderasyon + denetim (ADR-104). Tümü service-role arkasında.
 * Ban: banlı kullanıcı auth SONRASI 403 alır (ban.middleware). Admin banlanmaz
 * (öz-kilitlenme önlenir) — bu kuralı çağıran (route) uygular.
 */
export interface ModerationRepository {
  /** Kullanıcı banlı mı? (profiles.banned; satır yoksa false). */
  isBanned(userId: string): Promise<boolean>;
  /** Ban bayrağını ayarla (profiles upsert: satır yoksa oluşturur). */
  setBanned(userId: string, banned: boolean): Promise<void>;
  /** Denetim kaydı ekle (salt-ekleme; değiştirilemez). */
  writeAudit(entry: AuditEntry): Promise<void>;
  /** Son `limit` denetim kaydı, en yeni önce. */
  listAudit(limit: number): Promise<AdminAuditRow[]>;
}
