import { z } from "zod";
import { isoTimestamp } from "./common";

/** Duyuru türü — kart rozeti + ikon rengi (ADR-100). */
export const announcementKindSchema = z.enum(["info", "update", "promo", "warning"]);
export type AnnouncementKind = z.infer<typeof announcementKindSchema>;

/** Yalnız http(s) URL — javascript:/data: gibi şemalar engellenir (web XSS güvenliği). */
const httpUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((s) => /^https:\/\/|^http:\/\//i.test(s), "http(s) ile başlamalı");
/** Boş string → null; aksi halde http(s) doğrulanır. */
const optionalHttpUrl = z
  .union([httpUrl, z.literal(""), z.null()])
  .nullish()
  .transform((v) => (v ? v : null));

export const announcementSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  kind: announcementKindSchema,
  imageUrl: z.string().nullable(),
  ctaLabel: z.string().nullable(),
  ctaUrl: z.string().nullable(),
  pinned: z.boolean(),
  published: z.boolean(),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});
export type Announcement = z.infer<typeof announcementSchema>;

export const announcementListSchema = z.array(announcementSchema);

export const createAnnouncementInputSchema = z.object({
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(2).max(4000),
  kind: announcementKindSchema.default("info"),
  imageUrl: optionalHttpUrl,
  ctaLabel: z
    .string()
    .trim()
    .max(40)
    .nullish()
    .transform((v) => (v ? v : null)),
  ctaUrl: optionalHttpUrl,
  pinned: z.boolean().default(false),
  published: z.boolean().default(true),
});
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementInputSchema>;

/** Düzenleme/yayın-durumu değişimi — tüm alanlar opsiyonel (kısmi güncelleme). */
export const updateAnnouncementInputSchema = createAnnouncementInputSchema.partial();
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementInputSchema>;

export const announcementIdParamSchema = z.object({ id: z.string().min(1) });
