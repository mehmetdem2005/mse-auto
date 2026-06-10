import type {
  SupportKind,
  SupportMessageRow,
  SupportRepository,
  SupportSender,
  SupportStatus,
  SupportTicketRow,
} from "../../domain/support";
import { newId } from "../id";
import type { InMemoryStore } from "./store";

export class InMemorySupportRepository implements SupportRepository {
  constructor(private readonly store: InMemoryStore) {}

  private view(t: {
    id: string;
    userId: string;
    kind: SupportKind;
    status: SupportStatus;
    createdAt: string;
    updatedAt: string;
  }): SupportTicketRow {
    const msgs = this.store.supportMessages.filter((m) => m.ticketId === t.id);
    return { ...t, lastMessage: msgs.at(-1)?.body ?? null };
  }

  async createTicket(
    userId: string,
    kind: SupportKind,
    firstMessage: string,
  ): Promise<SupportTicketRow> {
    const now = new Date().toISOString();
    const t = {
      id: newId("tic"),
      userId,
      kind,
      status: "open" as const,
      createdAt: now,
      updatedAt: now,
    };
    this.store.supportTickets.push(t);
    await this.addMessage(t.id, "user", firstMessage);
    return this.view(t);
  }

  async listByUser(userId: string): Promise<SupportTicketRow[]> {
    return this.store.supportTickets
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((t) => this.view(t));
  }

  async listAll(): Promise<SupportTicketRow[]> {
    return [...this.store.supportTickets]
      .sort((a, b) => b.status.localeCompare(a.status) || b.createdAt.localeCompare(a.createdAt))
      .map((t) => this.view(t));
  }

  async findById(ticketId: string): Promise<SupportTicketRow | null> {
    const t = this.store.supportTickets.find((x) => x.id === ticketId);
    return t ? this.view(t) : null;
  }

  async listMessages(ticketId: string): Promise<SupportMessageRow[]> {
    return this.store.supportMessages
      .filter((m) => m.ticketId === ticketId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(({ ticketId: _t, ...m }) => m);
  }

  async addMessage(
    ticketId: string,
    sender: SupportSender,
    body: string,
  ): Promise<SupportMessageRow> {
    const m = { id: newId("msg"), ticketId, sender, body, createdAt: new Date().toISOString() };
    this.store.supportMessages.push(m);
    const t = this.store.supportTickets.find((x) => x.id === ticketId);
    if (t) t.updatedAt = m.createdAt;
    const { ticketId: _t, ...view } = m;
    return view;
  }

  async setStatus(ticketId: string, status: SupportStatus): Promise<void> {
    const t = this.store.supportTickets.find((x) => x.id === ticketId);
    if (t) {
      t.status = status;
      t.updatedAt = new Date().toISOString();
    }
  }
}
