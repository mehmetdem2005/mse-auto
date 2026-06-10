/** Destek katmanı (ADR-044): sorun bildirimi + canlı destek sohbeti. PII zonu. */

export type SupportKind = "problem" | "live";
export type SupportStatus = "open" | "closed";
export type SupportSender = "user" | "admin";

export interface SupportTicketRow {
  id: string;
  userId: string;
  kind: SupportKind;
  status: SupportStatus;
  createdAt: string;
  updatedAt: string;
  lastMessage: string | null;
}

export interface SupportMessageRow {
  id: string;
  sender: SupportSender;
  body: string;
  createdAt: string;
}

export interface SupportRepository {
  createTicket(userId: string, kind: SupportKind, firstMessage: string): Promise<SupportTicketRow>;
  listByUser(userId: string): Promise<SupportTicketRow[]>;
  /** Admin listesi: açıklar önce, sonra tarihe göre. */
  listAll(): Promise<SupportTicketRow[]>;
  findById(ticketId: string): Promise<SupportTicketRow | null>;
  listMessages(ticketId: string): Promise<SupportMessageRow[]>;
  addMessage(ticketId: string, sender: SupportSender, body: string): Promise<SupportMessageRow>;
  setStatus(ticketId: string, status: SupportStatus): Promise<void>;
}
