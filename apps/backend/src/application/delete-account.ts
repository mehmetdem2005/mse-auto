import type { AccountGateway } from "../domain/account";

export interface DeleteAccountDeps {
  account: AccountGateway;
}

/** Kullanıcının hesabını ve tüm verisini kalıcı siler (KVKK/GDPR). */
export async function deleteAccount(deps: DeleteAccountDeps, userId: string): Promise<void> {
  await deps.account.deleteAccount(userId);
}
