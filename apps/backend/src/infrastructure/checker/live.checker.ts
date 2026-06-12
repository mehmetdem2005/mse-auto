import type { CheckContext, CheckOutcome, Checker } from "../../domain/checker";
import type { Logger } from "../../domain/logger";
import type { EventReasoner } from "../../domain/reasoner";
import type { SearchHit, SearchProvider } from "../../domain/search";
import type { CanonicalTopic } from "../../domain/topic";
import { fetchOriginText } from "../search/origin";

/** Eskalasyon güven bandı (ADR-073/A2): bu aralıkta 2. derin tur yapılır. */
const ESCALATE_LOW = 0.4;
const ESCALATE_HIGH = 0.7;

/** Gerçek checker: web araması + DeepSeek muhakemesi (uçtan uca PII'siz). */
export class LiveChecker implements Checker {
  constructor(
    private readonly search: SearchProvider,
    private readonly reasoner: EventReasoner,
    /** JS-render proxy şablonu (ADR-070) — verilirse dinamik sayfalar okunur. */
    private readonly renderTemplate: string | null = null,
    /** Kontrol başına token bütçesi (ADR-081/A0) — null: sınırsız. */
    private readonly tokenBudget: number | null = null,
    private readonly logger?: Logger,
  ) {}

  /** Arama hatası akışı düşürmez ama SESSİZCE de kaybolmaz — iz bırakıp boş döner. */
  private searchFailed(stage: string): (err: unknown) => SearchHit[] {
    return (err) => {
      this.logger?.warn("search_failed", {
        stage,
        message: err instanceof Error ? err.message : String(err),
      });
      return [];
    };
  }

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
        ? this.search
            .search(`site:${ctx.authorityDomain} ${q}`)
            .catch(this.searchFailed("official"))
        : Promise.resolve([]),
      this.search.searchNews
        ? this.search.searchNews(q).catch(this.searchFailed("news"))
        : Promise.resolve([]),
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
    let finalHits =
      hits.length > 0
        ? hits.slice(0, 10)
        : await this.search.search(q).catch(this.searchFailed("fallback"));
    let r = await this.reasoner.reason({
      canonicalQuery: q,
      hits: finalHits,
      lastEventDescription: ctx?.lastEventDescription ?? null,
    });
    let tokensUsed = r.tokensUsed ?? null;

    // ESKALASYON (ADR-073/A2 — effort scaling): ilk karar BELİRSİZ güven bandındaysa
    // genel arama varyantıyla derin 2. tur + yeniden muhakeme. Net kararlar (yüksek/
    // düşük güven) tek turda kalır → ekstra LLM+arama maliyeti yalnız belirsiz vakada.
    // Maks 2 tur — guardrail sabit (sonsuz derinleşme yok).
    // TOKEN BÜTÇESİ (ADR-081/A0): ilk tur bütçeyi tükettiyse eskalasyon ATLANIR —
    // tek opsiyonel LLM çağrısı budur; atlama izde şeffafça işaretlenir.
    let escalated = false;
    let budgetSkipped = false;
    // SONAR derin tarama (ADR-089): abone açtıysa güven bandına bakılmaksızın
    // 2. derin tur ZORLANIR (daha kapsamlı). Token bütçesine yine SAYGI duyulur.
    const inBand = r.confidence >= ESCALATE_LOW && r.confidence <= ESCALATE_HIGH;
    const doEscalate = ctx?.deepScan === true || inBand;
    const overBudget = this.tokenBudget !== null && (tokensUsed ?? 0) >= this.tokenBudget;
    if (doEscalate && overBudget) budgetSkipped = true;
    if (doEscalate && !overBudget) {
      escalated = true;
      const extra = await this.search.search(q).catch(this.searchFailed("escalation"));
      const known = new Set(finalHits.map((h) => h.url));
      const merged = [...finalHits, ...extra.filter((h) => !known.has(h.url))].slice(0, 14);
      // Yeni kaynak gelmediyse 2. muhakemeyi boşa çağırma (token tasarrufu).
      if (merged.length > finalHits.length) {
        finalHits = merged;
        r = await this.reasoner.reason({
          canonicalQuery: q,
          hits: finalHits,
          lastEventDescription: ctx?.lastEventDescription ?? null,
        });
        if (r.tokensUsed != null) tokensUsed = (tokensUsed ?? 0) + r.tokensUsed;
      }
    }

    return {
      detected: r.detected,
      description: r.description,
      resultSummary: `${finalHits.length} sonuç (canlı: ${liveHit.length} · resmî: ${Math.min(official.length, 4)} · haber: ${news.length})${ctx?.deepScan ? " · sonar (derin)" : ""}${escalated ? " · eskalasyon (2. tur)" : ""}${budgetSkipped ? " · token bütçesi (eskalasyon atlandı)" : ""}`,
      reasoning: escalated ? `[ESKALASYON — belirsiz güven, 2. tur] ${r.reasoning}` : r.reasoning,
      confidence: r.confidence,
      searchQuery: ctx?.authorityDomain ? `${q} (+ site:${ctx.authorityDomain})` : q,
      hits: finalHits,
      tokensUsed,
    };
  }
}
