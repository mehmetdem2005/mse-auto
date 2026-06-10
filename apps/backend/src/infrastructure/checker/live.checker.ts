import type { CheckContext, CheckOutcome, Checker } from "../../domain/checker";
import type { EventReasoner } from "../../domain/reasoner";
import type { SearchProvider } from "../../domain/search";
import type { CanonicalTopic } from "../../domain/topic";

/** Gerçek checker: web araması + DeepSeek muhakemesi (uçtan uca PII'siz). */
export class LiveChecker implements Checker {
  constructor(
    private readonly search: SearchProvider,
    private readonly reasoner: EventReasoner,
  ) {}

  async check(topic: CanonicalTopic, ctx?: CheckContext): Promise<CheckOutcome> {
    const hits = await this.search.search(topic.canonicalQuery);
    const r = await this.reasoner.reason({
      canonicalQuery: topic.canonicalQuery,
      hits,
      lastEventDescription: ctx?.lastEventDescription ?? null,
    });
    return {
      detected: r.detected,
      description: r.description,
      resultSummary: `${hits.length} sonuç (${this.search.name})`,
      reasoning: r.reasoning,
      confidence: r.confidence,
      searchQuery: topic.canonicalQuery,
      hits,
    };
  }
}
