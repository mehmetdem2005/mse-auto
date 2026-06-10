import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SupportKind,
  SupportMessageRow,
  SupportRepository,
  SupportSender,
  SupportStatus,
  SupportTicketRow,
} from "../../domain/support";
import type { Database } from "./database.types";

type TicketRow = {
  id: string;
  user_id: string;
  kind: SupportKind;
  status: SupportStatus;
  created_at: string;
  updated_at: string;
};

export class SupabaseSupportRepository implements SupportRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  private async withLastMessage(rows: TicketRow[]): Promise<SupportTicketRow[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const { data, error } = await this.db
      .from("support_messages")
      .select("ticket_id, body, created_at")
      .in("ticket_id", ids)
      .order("created_at", { ascending: false });
    if (error) throw new Error(`support last messages: ${error.message}`);
    const last = new Map<string, string>();
    for (const m of data ?? []) {
      if (!last.has(m.ticket_id)) last.set(m.ticket_id, m.body);
    }
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      kind: r.kind,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      lastMessage: last.get(r.id) ?? null,
    }));
  }

  async createTicket(
    userId: string,
    kind: SupportKind,
    firstMessage: string,
  ): Promise<SupportTicketRow> {
    const { data, error } = await this.db
      .from("support_tickets")
      .insert({ user_id: userId, kind })
      .select("*")
      .single();
    if (error || !data) throw new Error(`support create: ${error?.message ?? "boş"}`);
    await this.addMessage(data.id, "user", firstMessage);
    return {
      id: data.id,
      userId: data.user_id,
      kind: data.kind,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastMessage: firstMessage,
    };
  }

  async listByUser(userId: string): Promise<SupportTicketRow[]> {
    const { data, error } = await this.db
      .from("support_tickets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(`support listByUser: ${error.message}`);
    return this.withLastMessage(data ?? []);
  }

  async listAll(): Promise<SupportTicketRow[]> {
    const { data, error } = await this.db
      .from("support_tickets")
      .select("*")
      .order("status", { ascending: false }) // 'open' > 'closed' alfabetik ters
      .order("created_at", { ascending: false });
    if (error) throw new Error(`support listAll: ${error.message}`);
    return this.withLastMessage(data ?? []);
  }

  async findById(ticketId: string): Promise<SupportTicketRow | null> {
    const { data, error } = await this.db
      .from("support_tickets")
      .select("*")
      .eq("id", ticketId)
      .maybeSingle();
    if (error) throw new Error(`support findById: ${error.message}`);
    if (!data) return null;
    const [t] = await this.withLastMessage([data]);
    return t ?? null;
  }

  async listMessages(ticketId: string): Promise<SupportMessageRow[]> {
    const { data, error } = await this.db
      .from("support_messages")
      .select("id, sender, body, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(`support messages: ${error.message}`);
    return (data ?? []).map((m) => ({
      id: m.id,
      sender: m.sender,
      body: m.body,
      createdAt: m.created_at,
    }));
  }

  async addMessage(
    ticketId: string,
    sender: SupportSender,
    body: string,
  ): Promise<SupportMessageRow> {
    const { data, error } = await this.db
      .from("support_messages")
      .insert({ ticket_id: ticketId, sender, body })
      .select("id, sender, body, created_at")
      .single();
    if (error || !data) throw new Error(`support addMessage: ${error?.message ?? "boş"}`);
    await this.db
      .from("support_tickets")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", ticketId);
    return { id: data.id, sender: data.sender, body: data.body, createdAt: data.created_at };
  }

  async setStatus(ticketId: string, status: SupportStatus): Promise<void> {
    const { error } = await this.db
      .from("support_tickets")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", ticketId);
    if (error) throw new Error(`support setStatus: ${error.message}`);
  }
}
