import { z } from "zod";

/** Destek talebi türü: tek seferlik sorun bildirimi veya canlı sohbet. */
export const supportKindSchema = z.enum(["problem", "live"]);
export type SupportKind = z.infer<typeof supportKindSchema>;

export const supportStatusSchema = z.enum(["open", "closed"]);
export type SupportStatus = z.infer<typeof supportStatusSchema>;

export const createSupportInputSchema = z.object({
  kind: supportKindSchema,
  message: z.string().min(3).max(2000),
});
export type CreateSupportInput = z.infer<typeof createSupportInputSchema>;

export const supportMessageSchema = z.object({
  id: z.string(),
  sender: z.enum(["user", "admin"]),
  body: z.string(),
  createdAt: z.string(),
});
export type SupportMessage = z.infer<typeof supportMessageSchema>;

export const supportTicketSchema = z.object({
  id: z.string(),
  kind: supportKindSchema,
  status: supportStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  /** Liste görünümleri için son mesaj önizlemesi. */
  lastMessage: z.string().nullable(),
});
export type SupportTicket = z.infer<typeof supportTicketSchema>;

/** Admin listesinde kullanıcı e-postası da görünür. */
export const adminSupportTicketSchema = supportTicketSchema.extend({
  userId: z.string(),
  userEmail: z.string().nullable(),
});
export type AdminSupportTicket = z.infer<typeof adminSupportTicketSchema>;

export const supportReplyInputSchema = z.object({
  body: z.string().min(1).max(2000),
});
export type SupportReplyInput = z.infer<typeof supportReplyInputSchema>;
