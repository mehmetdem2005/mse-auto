import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AnnouncementInput,
  AnnouncementKind,
  AnnouncementPatch,
  AnnouncementRepository,
  AnnouncementRow,
} from "../../domain/announcement";
import type { Database } from "./database.types";

type Row = Database["public"]["Tables"]["announcements"]["Row"];

function toRow(r: Row): AnnouncementRow {
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    kind: r.kind as AnnouncementKind,
    imageUrl: r.image_url,
    ctaLabel: r.cta_label,
    ctaUrl: r.cta_url,
    pinned: r.pinned,
    published: r.published,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** patch (camelCase) → DB sütunları (snake_case); yalnız verilen alanlar. */
function toColumns(p: AnnouncementPatch): Record<string, unknown> {
  const c: Record<string, unknown> = {};
  if (p.title !== undefined) c.title = p.title;
  if (p.body !== undefined) c.body = p.body;
  if (p.kind !== undefined) c.kind = p.kind;
  if (p.imageUrl !== undefined) c.image_url = p.imageUrl;
  if (p.ctaLabel !== undefined) c.cta_label = p.ctaLabel;
  if (p.ctaUrl !== undefined) c.cta_url = p.ctaUrl;
  if (p.pinned !== undefined) c.pinned = p.pinned;
  if (p.published !== undefined) c.published = p.published;
  return c;
}

export class SupabaseAnnouncementRepository implements AnnouncementRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  private async query(onlyPublished: boolean): Promise<AnnouncementRow[]> {
    let q = this.db
      .from("announcements")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });
    if (onlyPublished) q = q.eq("published", true);
    const { data, error } = await q;
    if (error) throw new Error(`announcements list: ${error.message}`);
    return (data ?? []).map(toRow);
  }

  listPublished(): Promise<AnnouncementRow[]> {
    return this.query(true);
  }
  listAll(): Promise<AnnouncementRow[]> {
    return this.query(false);
  }

  async create(input: AnnouncementInput): Promise<AnnouncementRow> {
    const { data, error } = await this.db
      .from("announcements")
      .insert({
        title: input.title,
        body: input.body,
        kind: input.kind,
        image_url: input.imageUrl,
        cta_label: input.ctaLabel,
        cta_url: input.ctaUrl,
        pinned: input.pinned,
        published: input.published,
      })
      .select("*")
      .single();
    if (error) throw new Error(`announcement create: ${error.message}`);
    return toRow(data);
  }

  async update(id: string, patch: AnnouncementPatch): Promise<AnnouncementRow | null> {
    const { data, error } = await this.db
      .from("announcements")
      .update({ ...toColumns(patch), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`announcement update: ${error.message}`);
    return data ? toRow(data) : null;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.db.from("announcements").delete().eq("id", id);
    if (error) throw new Error(`announcement delete: ${error.message}`);
  }
}
