import type {
  AnnouncementInput,
  AnnouncementPatch,
  AnnouncementRepository,
  AnnouncementRow,
} from "../../domain/announcement";
import { newId } from "../id";

/** Dev/test duyuru deposu — süreç belleği. */
export class InMemoryAnnouncementRepository implements AnnouncementRepository {
  private readonly rows: AnnouncementRow[] = [];

  private sorted(rows: AnnouncementRow[]): AnnouncementRow[] {
    return [...rows].sort(
      (a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt),
    );
  }

  async listPublished(): Promise<AnnouncementRow[]> {
    return this.sorted(this.rows.filter((r) => r.published));
  }

  async listAll(): Promise<AnnouncementRow[]> {
    return this.sorted(this.rows);
  }

  async create(input: AnnouncementInput): Promise<AnnouncementRow> {
    const now = new Date().toISOString();
    const row: AnnouncementRow = {
      id: newId("ann"),
      createdAt: now,
      updatedAt: now,
      ...input,
      recipientUserId: input.recipientUserId ?? null, // ADR-134: global varsayılan
      templateKey: input.templateKey ?? null, // ADR-135
      lang: input.lang ?? null, // ADR-135: tüm diller
    };
    this.rows.push(row);
    return row;
  }

  async update(id: string, patch: AnnouncementPatch): Promise<AnnouncementRow | null> {
    const row = this.rows.find((r) => r.id === id);
    if (!row) return null;
    Object.assign(row, patch, { updatedAt: new Date().toISOString() });
    return row;
  }

  async remove(id: string): Promise<void> {
    const i = this.rows.findIndex((r) => r.id === id);
    if (i >= 0) this.rows.splice(i, 1);
  }

  async existsForRecipient(userId: string, templateKey: string): Promise<boolean> {
    return this.rows.some((r) => r.recipientUserId === userId && r.templateKey === templateKey);
  }
}
