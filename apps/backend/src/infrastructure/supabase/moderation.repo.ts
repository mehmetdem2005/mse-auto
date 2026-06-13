import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminAuditRow, AuditEntry, ModerationRepository } from "../../domain/moderation";
import type { Database, Json } from "./database.types";

/** Moderasyon + denetim (ADR-104) — service-role client (RLS bypass). */
export class SupabaseModerationRepository implements ModerationRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async isBanned(userId: string): Promise<boolean> {
    const { data, error } = await this.db
      .from("profiles")
      .select("banned")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(`isBanned: ${error.message}`);
    return data?.banned ?? false;
  }

  async setBanned(userId: string, banned: boolean): Promise<void> {
    // profiles satırı trigger'sız boş kalabiliyor → upsert (id PK çakışmasında günceller).
    const { error } = await this.db
      .from("profiles")
      .upsert({ id: userId, banned }, { onConflict: "id" });
    if (error) throw new Error(`setBanned: ${error.message}`);
  }

  async writeAudit(entry: AuditEntry): Promise<void> {
    const { error } = await this.db.from("admin_audit").insert({
      actor_id: entry.actorId,
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId ?? null,
      meta: (entry.meta ?? null) as Json,
    });
    if (error) throw new Error(`writeAudit: ${error.message}`);
  }

  async listAudit(limit: number): Promise<AdminAuditRow[]> {
    const { data, error } = await this.db
      .from("admin_audit")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`listAudit: ${error.message}`);
    return (data ?? []).map((r) => ({
      id: r.id,
      actorId: r.actor_id,
      action: r.action,
      targetType: r.target_type,
      targetId: r.target_id,
      meta: (r.meta as Record<string, unknown> | null) ?? null,
      createdAt: r.created_at,
    }));
  }
}
