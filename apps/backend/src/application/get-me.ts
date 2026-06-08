import type { Me } from "@watcher/contracts";
import type { AdminRepository } from "../domain/billing";

export async function getMe(
  deps: { admin: AdminRepository },
  userId: string,
  email: string | null,
): Promise<Me> {
  const isAdmin = await deps.admin.isAdmin(userId);
  return { userId, email, isAdmin };
}
