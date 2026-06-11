import type { CheckOutcome } from "./checker";

/**
 * Eval düzeneği (ADR-075 / ajan planı A4): tespit kalitesini ÖLÇÜLEBİLİR kılar.
 * Golden-set + deterministik judge → her iyileştirmenin etkisini sayıyla görmek.
 * Judge LLM gerektirmez (kural-tabanlı) → CI'da deterministik çalışır, ücretsiz.
 */

/** Bir golden test vakası: girdi + beklenen sonuç. */
export interface GoldenCase {
  id: string;
  /** İzlenen konu (PII'siz). */
  query: string;
  /** Tekrar-bildirim senaryosu için önceki olay (ADR-037). */
  lastEventDescription?: string | null;
  expect: {
    /** Olay tespit edilmeli mi? (en kritik sinyal) */
    detected: boolean;
    /** detected=true ise açıklamada geçmesi gereken anahtar kelimeler (küçük harf). */
    mustInclude?: string[];
    /** Güven alt/üst sınırı (kalibrasyon kontrolü). */
    confidenceAtLeast?: number;
    confidenceAtMost?: number;
  };
}

export interface CaseScore {
  id: string;
  passed: boolean;
  score: number; // 0..1 ağırlıklı
  /** Tanılama: hangi alt-kontrol geçti/kaldı. */
  detail: {
    detectionMatch: boolean;
    includeMatch: boolean;
    confidenceOk: boolean;
  };
  note: string;
}

export interface EvalReport {
  total: number;
  passed: number;
  passRate: number; // 0..1
  avgScore: number; // 0..1
  /** detected alanının doğru bilindiği oran (en kritik metrik). */
  detectionAccuracy: number;
  /** Yanlış-pozitif: beklenen false, tahmin true (kullanıcıya yanlış bildirim). */
  falsePositives: number;
  /** Yanlış-negatif: beklenen true, tahmin false (kaçırılan gerçek olay). */
  falseNegatives: number;
  cases: CaseScore[];
}

const W_DETECTION = 0.6;
const W_INCLUDE = 0.3;
const W_CONFIDENCE = 0.1;

/** Tek vakayı kural-tabanlı puanla (deterministik; LLM yok). */
export function judgeCase(g: GoldenCase, r: CheckOutcome): CaseScore {
  const detectionMatch = g.expect.detected === r.detected;

  // mustInclude yalnız tespit beklenen ve gerçekleşen vakada anlamlı.
  let includeMatch = true;
  if (g.expect.detected && g.expect.mustInclude && g.expect.mustInclude.length > 0) {
    const hay = (r.description ?? "").toLowerCase();
    includeMatch = r.detected && g.expect.mustInclude.every((kw) => hay.includes(kw.toLowerCase()));
  }

  let confidenceOk = true;
  if (g.expect.confidenceAtLeast !== undefined) {
    confidenceOk = confidenceOk && r.confidence >= g.expect.confidenceAtLeast;
  }
  if (g.expect.confidenceAtMost !== undefined) {
    confidenceOk = confidenceOk && r.confidence <= g.expect.confidenceAtMost;
  }

  const score =
    (detectionMatch ? W_DETECTION : 0) +
    (includeMatch ? W_INCLUDE : 0) +
    (confidenceOk ? W_CONFIDENCE : 0);
  // Geçme: tespit kararı DOĞRU olmalı (olmazsa vaka başarısız) + diğer kontroller.
  const passed = detectionMatch && includeMatch && confidenceOk;

  const fails: string[] = [];
  if (!detectionMatch) fails.push(`detected beklenen=${g.expect.detected} gerçek=${r.detected}`);
  if (!includeMatch) fails.push("açıklama anahtar kelimeleri içermiyor");
  if (!confidenceOk) fails.push(`güven bandı dışı (${r.confidence})`);

  return {
    id: g.id,
    passed,
    score,
    detail: { detectionMatch, includeMatch, confidenceOk },
    note: passed ? "ok" : fails.join("; "),
  };
}

/** Vaka skorlarını rapora indirger (precision/recall tarzı tespit metrikleri). */
export function summarize(cases: CaseScore[], goldens: GoldenCase[]): EvalReport {
  const total = cases.length;
  const passed = cases.filter((c) => c.passed).length;
  const avgScore = total > 0 ? cases.reduce((s, c) => s + c.score, 0) / total : 0;
  const detectionRight = cases.filter((c) => c.detail.detectionMatch).length;

  const byId = new Map(goldens.map((g) => [g.id, g]));
  let falsePositives = 0;
  let falseNegatives = 0;
  for (const c of cases) {
    if (c.detail.detectionMatch) continue;
    const g = byId.get(c.id);
    if (!g) continue;
    // Beklenen false ama tahmin true → yanlış-pozitif; tersi → yanlış-negatif.
    if (g.expect.detected) falseNegatives += 1;
    else falsePositives += 1;
  }

  return {
    total,
    passed,
    passRate: total > 0 ? passed / total : 0,
    avgScore,
    detectionAccuracy: total > 0 ? detectionRight / total : 0,
    falsePositives,
    falseNegatives,
    cases,
  };
}
