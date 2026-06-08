/** Hesap silme (KVKK/GDPR). Kullanıcının tüm verisini + kimliğini kalıcı siler. İdempotent. */
export interface AccountGateway {
  deleteAccount(userId: string): Promise<void>;
}
