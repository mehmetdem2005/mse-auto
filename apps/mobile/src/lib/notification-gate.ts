import { type EventFacts, evaluateCriterion, parseEventFacts } from "../domain/personal";
import { getCriterion } from "./criteria-store";

export interface GateResult {
  surface: boolean;
  reason: string;
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/**
 * Gelen push'un kullanıcıya GÖSTERİLİP gösterilmeyeceğine CİHAZDA karar verir (ADR-015).
 * - watchId yoksa → göster (bilgi yok).
 * - yerel kriter yoksa → göster (paylaşılan, ya da kriteri olmayan kişisel watch).
 * - kriter varsa → facts'i değerlendir; eşleşirse göster, eşleşmezse bastır.
 * Fail-open: facts ayrıştırılamazsa gösterir (kullanıcı sessizce kaçırmasın).
 * Bu fonksiyon expo-notifications alıcı dinleyicisinden çağrılmalıdır.
 */
export async function shouldSurface(data: Record<string, string | undefined>): Promise<GateResult> {
  const watchId = data.watchId;
  if (!watchId) return { surface: true, reason: "watchId yok" };
  const criterion = await getCriterion(watchId);
  if (!criterion) return { surface: true, reason: "yerel kriter yok" };
  const facts: EventFacts | null = data.facts ? parseEventFacts(safeJson(data.facts)) : null;
  if (!facts) return { surface: true, reason: "facts yok/geçersiz (fail-open)" };
  const r = evaluateCriterion(criterion, facts);
  return { surface: r.matched, reason: r.reason };
}
