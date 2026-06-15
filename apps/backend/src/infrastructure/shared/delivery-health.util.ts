/**
 * Teslimat sağlığı (ADR-142) — saf hesap, test edilebilir. Terminal durumlar: sent+delivered (başarı)
 * ve failed (başarısız); "pending" terminal DEĞİL (henüz sonuçlanmadı → orana katılmaz). successRate
 * 0-100 tamsayı; hiç terminal teslimat yoksa null (istemci "—"/"henüz veri yok" gösterir).
 */
export function deliveryHealth(statuses: readonly string[]): {
  successRate: number | null;
  failed: number;
} {
  let succeeded = 0;
  let failed = 0;
  for (const s of statuses) {
    if (s === "sent" || s === "delivered") succeeded++;
    else if (s === "failed") failed++;
  }
  const terminal = succeeded + failed;
  return {
    successRate: terminal > 0 ? Math.round((succeeded / terminal) * 100) : null,
    failed,
  };
}
