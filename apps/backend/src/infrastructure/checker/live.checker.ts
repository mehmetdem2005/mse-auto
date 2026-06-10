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
    // ADR-046: önce RESMÎ kaynak (site:domain) + son 24 saatin HABERLERİ;
    // ikisi de boşsa genel arama (qdr:w → filtresiz) yedeği.
    const q = topic.canonicalQuery;
    const [official, news] = await Promise.all([
      ctx?.authorityDomain
        ? this.search.search(`site:${ctx.authorityDomain} ${q}`).catch(() => [])
        : Promise.resolve([]),
      this.search.searchNews ? this.search.searchNews(q).catch(() => []) : Promise.resolve([]),
    ]);
    // Resmî sonuçlar başa + [RESMÎ] etiketi (model güven sıralaması için); URL dedupe.
    const seen = new Set<string>();
    const hits = [
      ...official.slice(0, 4).map((h) => ({ ...h, title: `[RESMÎ] ${h.title}` })),
      ...news,
    ].filter((h) => {
      if (seen.has(h.url)) return false;
      seen.add(h.url);
      return true;
    });
    const finalHits = hits.length > 0 ? hits.slice(0, 10) : await this.search.search(q);
    const r = await this.reasoner.reason({
      canonicalQuery: q,
      hits: finalHits,
      lastEventDescription: ctx?.lastEventDescription ?? null,
    });
    return {
      detected: r.detected,
      description: r.description,
      resultSummary: `${finalHits.length} sonuç (resmî: ${Math.min(official.length, 4)} · haber: ${news.length})`,
      reasoning: r.reasoning,
      confidence: r.confidence,
      searchQuery: ctx?.authorityDomain ? `${q} (+ site:${ctx.authorityDomain})` : q,
      hits: finalHits,
    };
  }
}
