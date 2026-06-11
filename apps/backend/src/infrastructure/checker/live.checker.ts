import type { CheckContext, CheckOutcome, Checker } from "../../domain/checker";
import type { EventReasoner } from "../../domain/reasoner";
import type { SearchProvider } from "../../domain/search";
import type { CanonicalTopic } from "../../domain/topic";
import { fetchOriginText } from "../search/origin";

/** Gerçek checker: web araması + DeepSeek muhakemesi (uçtan uca PII'siz). */
export class LiveChecker implements Checker {
  constructor(
    private readonly search: SearchProvider,
    private readonly reasoner: EventReasoner,
    /** JS-render proxy şablonu (ADR-070) — verilirse dinamik sayfalar okunur. */
    private readonly renderTemplate: string | null = null,
  ) {}

  async check(topic: CanonicalTopic, ctx?: CheckContext): Promise<CheckOutcome> {
    // ADR-046: önce RESMÎ kaynak (site:domain) + son 24 saatin HABERLERİ;
    // ikisi de boşsa genel arama (qdr:w → filtresiz) yedeği.
    const q = topic.canonicalQuery;
    const [liveText, official, news] = await Promise.all([
      // ADR-047: tarama ANINDA resmî sitenin kendisi — indeks gecikmesi sıfır.
      ctx?.authorityDomain
        ? fetchOriginText(ctx.authorityDomain, fetch, this.renderTemplate)
        : Promise.resolve(null),
      ctx?.authorityDomain
        ? this.search.search(`site:${ctx.authorityDomain} ${q}`).catch(() => [])
        : Promise.resolve([]),
      this.search.searchNews ? this.search.searchNews(q).catch(() => []) : Promise.resolve([]),
    ]);
    // Resmî sonuçlar başa + [RESMÎ] etiketi (model güven sıralaması için); URL dedupe.
    const seen = new Set<string>();
    const liveHit =
      liveText && ctx?.authorityDomain
        ? [
            {
              title: `[CANLI] ${ctx.authorityDomain} — sayfanın ŞU ANKİ içeriği`,
              snippet: liveText,
              url: `https://${ctx.authorityDomain}/`,
              date: "şu an",
            },
          ]
        : [];
    // ADR-050: kaynak tercihi sıralamayı değiştirir (varsayılan: canlı > resmî > haber).
    const officialTagged = official.slice(0, 4).map((h) => ({ ...h, title: `[RESMÎ] ${h.title}` }));
    const pref = ctx?.sourcePref ?? null;
    const ordered =
      pref === "news"
        ? [...news, ...liveHit, ...officialTagged]
        : pref === "web"
          ? [...liveHit, ...news, ...officialTagged] // web: genel yedek zaten devrede; haber öne
          : [...liveHit, ...officialTagged, ...news]; // auto/official: resmî öncelik
    const hits = ordered.filter((h) => {
      if (seen.has(h.url)) return false;
      seen.add(h.url);
      return true;
    });
    // Hiç kaynak yoksa genel arama yedeği; o da patlarsa boş (checker hatası kaydı
    // run-topic-check tarafından DB'ye yazılır → sessiz değil).
    const finalHits =
      hits.length > 0 ? hits.slice(0, 10) : await this.search.search(q).catch(() => []);
    const r = await this.reasoner.reason({
      canonicalQuery: q,
      hits: finalHits,
      lastEventDescription: ctx?.lastEventDescription ?? null,
    });
    return {
      detected: r.detected,
      description: r.description,
      resultSummary: `${finalHits.length} sonuç (canlı: ${liveHit.length} · resmî: ${Math.min(official.length, 4)} · haber: ${news.length})`,
      reasoning: r.reasoning,
      confidence: r.confidence,
      searchQuery: ctx?.authorityDomain ? `${q} (+ site:${ctx.authorityDomain})` : q,
      hits: finalHits,
    };
  }
}
