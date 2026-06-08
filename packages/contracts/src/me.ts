import { z } from "zod";

export const meSchema = z.object({
  userId: z.string(),
  email: z.string().nullable(),
  isAdmin: z.boolean(),
});
export type Me = z.infer<typeof meSchema>;
