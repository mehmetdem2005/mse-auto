export interface DeviceRepository {
  /** Cihaz token'ını kaydet/güncelle (user_id + token tekil). */
  save(input: { userId: string; token: string; platform: string }): Promise<void>;
  /** Kullanıcının aktif FCM token'ları (fan-out teslimi için). */
  listTokens(userId: string): Promise<string[]>;
}
