/**
 * Uygulama-geneli ayar deposu port'u (ADR-095). İlk kullanım: admin'in seçtiği
 * global LLM modeli. PII içermez; yalnız backend (service-role) erişir.
 */
export interface SettingsRepository {
  get(key: string): Promise<unknown | null>;
  /**
   * true → kalıcı yazıldı; false → kalıcı depo henüz yok (migration 0014 bekliyor),
   * değer yalnız süreç belleğinde yaşar ve deploy'da sıfırlanır. Admin arayüzü bu
   * durumu DÜRÜSTÇE gösterir; sessizce "kaydedildi" denmez.
   */
  set(key: string, value: unknown): Promise<boolean>;
}
