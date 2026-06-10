import type { EventFacts } from "./personal";
import type { SearchHit } from "./search";

export interface ReasonInput {
  canonicalQuery: string; // PII'siz
  hits: SearchHit[];
  /** Daha önce bildirilen son olay — verilirse yalnız BUNDAN YENİ gelişme tespit sayılır. */
  lastEventDescription?: string | null;
}

export interface ReasonResult {
  detected: boolean;
  description: string | null;
  reasoning: string;
  confidence: number; // 0..1
  facts?: EventFacts | null; // arketip-B: yapılı kamusal veri
}

/** Olay muhakemesi port'u (DeepSeek). Sadece PII'siz girdi alır. */
export interface EventReasoner {
  reason(input: ReasonInput): Promise<ReasonResult>;
}
