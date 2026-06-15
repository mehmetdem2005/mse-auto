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

export interface ChannelHealth {
  channel: string;
  total: number;
  failed: number;
  successRate: number | null;
}

/**
 * Kanal-bazlı teslimat sağlığı (ADR-146 / M7.5) — "hangi kanal bozuk" görünürlüğü (push/telegram/
 * whatsapp/email ayrı). Her kanal için `deliveryHealth`; total'e göre azalan sıralı (en yoğun önce).
 */
export function channelHealth(rows: { status: string; channel: string }[]): ChannelHealth[] {
  const byChannel = new Map<string, string[]>();
  for (const r of rows) {
    const arr = byChannel.get(r.channel);
    if (arr) arr.push(r.status);
    else byChannel.set(r.channel, [r.status]);
  }
  return [...byChannel.entries()]
    .map(([channel, statuses]) => {
      const h = deliveryHealth(statuses);
      return { channel, total: statuses.length, failed: h.failed, successRate: h.successRate };
    })
    .sort((a, b) => b.total - a.total);
}
