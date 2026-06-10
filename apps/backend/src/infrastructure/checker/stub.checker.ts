import type { CheckOutcome, Checker } from "../../domain/checker";
import type { CanonicalTopic } from "../../domain/topic";

/** Placeholder checker — Faz 6'da DeepSeek + web araması ile değişecek. */
export class StubChecker implements Checker {
  async check(topic: CanonicalTopic): Promise<CheckOutcome> {
    return {
      detected: false,
      description: null,
      resultSummary: `(stub) "${topic.canonicalQuery}" için arama yapılmadı`,
      reasoning: "(stub) Faz 6: DeepSeek + web araması",
      confidence: 0,
      searchQuery: topic.canonicalQuery,
      hits: [],
    };
  }
}
