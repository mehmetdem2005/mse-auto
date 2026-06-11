/**
 * Ajan döngüsü guardrail'leri (ADR-076 / plan A0). Sektör konsensüsü: max-tur +
 * token-bütçe + timeout + ilerleme-yok birlikte zorunlu (bütçesiz ajanlar gerçekte
 * 47.000$ fatura üretti). Bu modül DETERMİNİSTİK kapıları açık koda döker.
 *
 * Bu turda uygulanan: WALL-CLOCK TIMEOUT (asılı/yavaş checker'ı keser).
 * - Tur limiti: LiveChecker'da maks 2 (ADR-073 eskalasyon) — zaten sabit.
 * - Token bütçesi: A3 (token izleri) sonrası eklenecek — şimdilik yok (dürüst).
 */

/** Zaman aşımında atılan ayırt edilebilir hata (catch tarafı "timeout" diyebilsin). */
export class TimeoutError extends Error {
  constructor(
    public readonly ms: number,
    label: string,
  ) {
    super(`${label}: ${ms}ms zaman aşımı`);
    this.name = "TimeoutError";
  }
}

/**
 * Bir promise'i wall-clock süreyle sınırlar. Süre dolarsa TimeoutError reddi döner
 * (sarılan iş arka planda sürebilir ama sonucu yok sayılır — kuyruğu kilitlemez).
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(ms, label)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer)) as Promise<T>;
}
