import type { AdminRepository } from "../../domain/billing";

export class InMemoryAdminRepository implements AdminRepository {
  constructor(private readonly adminIds: ReadonlySet<string>) {}
  async isAdmin(userId: string): Promise<boolean> {
    return this.adminIds.has(userId);
  }
}
