import { z } from "zod";

export const errorSchema = z.object({ error: z.string() });
export type ApiError = z.infer<typeof errorSchema>;
