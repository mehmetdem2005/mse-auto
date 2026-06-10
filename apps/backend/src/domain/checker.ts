import type { EventFacts } from "./personal";
import type { SearchHit } from "./search";
import type { CanonicalTopic } from "./topic";

/** Bir topic için arama+muhakeme sonucu (hepsi PII'siz). */
export interface CheckOutcome {
  detected: boolean;
  description: string | null; // detected ise olay açıklaması
  resultSummary: string;
  reasoning: string;
  confidence: number; // 0..1
  facts?: EventFacts | null; // arketip-B (ADR-015)
  // Arama süreci şeffaflığı (ADR-036): ne arandı + hangi sonuçlar görüldü.
  searchQuery?: string | null;
  hits?: SearchHit[] | null;
}

/** Kontrol bağlamı: tekrar-bildirim bastırma için son bildirilen olay (ADR-037). */
export interface CheckContext {
  lastEventDescription: string | null;
  /** Konunun resmî kaynak alan adı (ADR-046) — varsa önce orada aranır. */
  authorityDomain?: string | null;
}

/** Checker port'u — arama + muhakeme; ctx verilirse yalnız YENİ gelişme tespit sayılır. */
export interface Checker {
  check(topic: CanonicalTopic, ctx?: CheckContext): Promise<CheckOutcome>;
}
