import type { EventFacts } from "./personal";
import type { CanonicalTopic } from "./topic";

/** Bir topic için arama+muhakeme sonucu (hepsi PII'siz). */
export interface CheckOutcome {
  detected: boolean;
  description: string | null; // detected ise olay açıklaması
  resultSummary: string;
  reasoning: string;
  confidence: number; // 0..1
  facts?: EventFacts | null; // arketip-B (ADR-015)
}

/** Checker port'u — Faz 6'da DeepSeek + web araması implemente eder. */
export interface Checker {
  check(topic: CanonicalTopic): Promise<CheckOutcome>;
}
