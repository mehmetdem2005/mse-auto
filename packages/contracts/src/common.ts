import { z } from "zod";

/** Paylaşılan ilkel şemalar (Zod 4). */
export const isoTimestamp = z.iso.datetime();
export type IsoTimestamp = z.infer<typeof isoTimestamp>;

export const id = z.string().min(1);
export type Id = z.infer<typeof id>;
