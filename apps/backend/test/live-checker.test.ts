import { describe, expect, it } from "vitest";
import type { EventReasoner, ReasonInput } from "../src/domain/reasoner";
import type { SearchHit, SearchProvider } from "../src/domain/search";
import type { CanonicalTopic } from "../src/domain/topic";
import { LiveChecker } from "../src/infrastructure/checker/live.checker";

const topic: CanonicalTopic = { id: "t1", canonicalQuery: "resmî duyuru", lastCheckedAt: null };

/** Reasoner casusu: aldığı hits'i yakalar. */
function spyReasoner(): { reasoner: EventReasoner; seen: ReasonInput[] } {
  const seen: ReasonInput[] = [];
  return {
    seen,
    reasoner: {
      async reason(input) {
        seen.push(input);
        return { detected: false, description: null, reasoning: "r", confidence: 0.5 };
      },
    },
  };
}

function provider(opts: {
  general?: SearchHit[];
  site?: SearchHit[];
  news?: SearchHit[];
  generalThrows?: boolean;
}): SearchProvider {
  return {
    name: "fake",
    async search(q: string) {
      if (q.startsWith("site:")) return opts.site ?? [];
      if (opts.generalThrows) throw new Error("kota");
      return opts.general ?? [];
    },
    async searchNews() {
      return opts.news ?? [];
    },
  };
}

const hit = (t: string): SearchHit => ({ title: t, snippet: "s", url: `u-${t}`, date: null });

describe("LiveChecker orkestrasyonu (ADR-046/047/048)", () => {
  it("authority yoksa yalnız genel arama; news yine de eklenir", async () => {
    const { reasoner, seen } = spyReasoner();
    const c = new LiveChecker(provider({ general: [hit("g1")], news: [hit("n1")] }), reasoner);
    await c.check(topic); // ctx yok → authorityDomain undefined
    const titles = seen[0]?.hits.map((h) => h.title) ?? [];
    expect(titles).toContain("n1"); // haber eklenir
    expect(titles.every((t) => !t.startsWith("[RESMÎ]"))).toBe(true);
  });

  it("authority varken site sonuçları [RESMÎ] etiketli ve haberden ÖNCE gelir", async () => {
    const { reasoner, seen } = spyReasoner();
    const c = new LiveChecker(provider({ site: [hit("o1")], news: [hit("n1")] }), reasoner);
    await c.check(topic, { lastEventDescription: null, authorityDomain: "kurum.gov.tr" });
    const titles = seen[0]?.hits.map((h) => h.title) ?? [];
    expect(titles[0]).toBe("[RESMÎ] o1"); // resmî başta
    expect(titles).toContain("n1");
  });

  it("hiç kaynak yoksa genel arama yedeğine düşer", async () => {
    const { reasoner, seen } = spyReasoner();
    const c = new LiveChecker(
      provider({ site: [], news: [], general: [hit("fallback")] }),
      reasoner,
    );
    await c.check(topic, { lastEventDescription: null, authorityDomain: "kurum.gov.tr" });
    expect(seen[0]?.hits.map((h) => h.title)).toContain("fallback");
  });

  it("genel arama yedeği patlasa bile çökmez (boş hits ile muhakeme)", async () => {
    const { reasoner, seen } = spyReasoner();
    const c = new LiveChecker(provider({ site: [], news: [], generalThrows: true }), reasoner);
    const out = await c.check(topic, {
      lastEventDescription: null,
      authorityDomain: "kurum.gov.tr",
    });
    expect(out.detected).toBe(false);
    expect(seen[0]?.hits).toEqual([]); // yedek patladı → boş, ama akış sürdü
  });

  it("sourcePref=news → haber sonuçları RESMÎ'den önce gelir (ADR-050)", async () => {
    const { reasoner, seen } = spyReasoner();
    const c = new LiveChecker(provider({ site: [hit("o1")], news: [hit("n1")] }), reasoner);
    await c.check(topic, {
      lastEventDescription: null,
      authorityDomain: "kurum.gov.tr",
      sourcePref: "news",
    });
    const titles = seen[0]?.hits.map((h) => h.title) ?? [];
    expect(titles[0]).toBe("n1"); // haber önce
    expect(titles).toContain("[RESMÎ] o1");
  });

  it("lastEventDescription muhakemeye iletilir (tekrar-bastırma)", async () => {
    const { reasoner, seen } = spyReasoner();
    const c = new LiveChecker(provider({ general: [hit("g")] }), reasoner);
    await c.check(topic, { lastEventDescription: "önceki olay" });
    expect(seen[0]?.lastEventDescription).toBe("önceki olay");
  });
});

describe("eskalasyon turu (ADR-073/A2)", () => {
  function reasonerWith(
    confidences: number[],
    tokensPerCall = 100,
  ): { reasoner: EventReasoner; calls: number[] } {
    const calls: number[] = [];
    let i = 0;
    return {
      calls,
      reasoner: {
        async reason(input) {
          calls.push(input.hits.length);
          const c = confidences[Math.min(i, confidences.length - 1)] ?? 0.9;
          i += 1;
          return {
            detected: false,
            description: null,
            reasoning: "r",
            confidence: c,
            tokensUsed: tokensPerCall,
          };
        },
      },
    };
  }
  const hit = (u: string): SearchHit => ({ title: u, snippet: "s", url: u, date: null });

  it("belirsiz güvende (0.4–0.7) yeni kaynak varsa 2. muhakeme yapılır ve özet işaretlenir", async () => {
    const { reasoner, calls } = reasonerWith([0.55, 0.85]);
    // İlk tur haber kaynağı kullanır; eskalasyondaki genel arama YENİ url getirir.
    const p = provider({ news: [hit("https://a.com")], general: [hit("https://b.com")] });
    const checker = new LiveChecker(p, reasoner);
    const out = await checker.check(topic, { lastEventDescription: null });
    expect(calls.length).toBe(2); // eskalasyon → 2. çağrı
    expect(calls[1]).toBeGreaterThan(calls[0] ?? 0); // 2. turda daha fazla kaynak
    expect(out.resultSummary).toContain("eskalasyon");
    expect(out.reasoning).toContain("ESKALASYON");
    expect(out.confidence).toBe(0.85); // 2. turun kararı geçerli
  });

  it("net (yüksek) güvende eskalasyon TETİKLENMEZ — tek muhakeme", async () => {
    const { reasoner, calls } = reasonerWith([0.95]);
    const p = provider({ news: [hit("https://a.com")], general: [hit("https://b.com")] });
    const checker = new LiveChecker(p, reasoner);
    const out = await checker.check(topic, { lastEventDescription: null });
    expect(calls.length).toBe(1);
    expect(out.resultSummary).not.toContain("eskalasyon");
  });

  it("belirsiz güvende YENİ kaynak yoksa 2. muhakeme boşa çağrılmaz (token tasarrufu)", async () => {
    const { reasoner, calls } = reasonerWith([0.5]);
    // Genel arama da aynı url'i döner → merge yeni kaynak eklemez.
    const p = provider({ news: [hit("https://same.com")], general: [hit("https://same.com")] });
    const checker = new LiveChecker(p, reasoner);
    await checker.check(topic, { lastEventDescription: null });
    expect(calls.length).toBe(1);
  });
});

describe("token bütçesi guardrail'i (ADR-081/A0)", () => {
  const hit = (u: string): SearchHit => ({ title: u, snippet: "s", url: u, date: null });
  function reasonerWith(
    confidences: number[],
    tokensPerCall: number,
  ): { reasoner: EventReasoner; calls: number[] } {
    const calls: number[] = [];
    let i = 0;
    return {
      calls,
      reasoner: {
        async reason(input) {
          calls.push(input.hits.length);
          const c = confidences[Math.min(i, confidences.length - 1)] ?? 0.9;
          i += 1;
          return {
            detected: false,
            description: null,
            reasoning: "r",
            confidence: c,
            tokensUsed: tokensPerCall,
          };
        },
      },
    };
  }

  it("ilk tur bütçeyi tükettiyse eskalasyon ATLANIR ve iz şeffafça işaretlenir", async () => {
    const { reasoner, calls } = reasonerWith([0.55], 5000); // belirsiz bant + ağır ilk tur
    const p = provider({ news: [hit("https://a.com")], general: [hit("https://b.com")] });
    const checker = new LiveChecker(p, reasoner, null, 4000); // bütçe < ilk tur
    const out = await checker.check(topic, { lastEventDescription: null });
    expect(calls.length).toBe(1); // 2. muhakeme YOK
    expect(out.resultSummary).toContain("token bütçesi");
    expect(out.resultSummary).not.toContain("eskalasyon (2. tur)");
    expect(out.tokensUsed).toBe(5000);
  });

  it("bütçe yeterliyse eskalasyon normal işler (bütçe yanlış-pozitif kısmaz)", async () => {
    const { reasoner, calls } = reasonerWith([0.55, 0.85], 1000);
    const p = provider({ news: [hit("https://a.com")], general: [hit("https://b.com")] });
    const checker = new LiveChecker(p, reasoner, null, 4000); // bütçe > ilk tur
    const out = await checker.check(topic, { lastEventDescription: null });
    expect(calls.length).toBe(2);
    expect(out.resultSummary).toContain("eskalasyon (2. tur)");
    expect(out.tokensUsed).toBe(2000); // iki turun toplamı
  });

  it("bütçe verilmemişse (null) davranış değişmez — sınırsız", async () => {
    const { reasoner, calls } = reasonerWith([0.55, 0.85], 99999);
    const p = provider({ news: [hit("https://a.com")], general: [hit("https://b.com")] });
    const checker = new LiveChecker(p, reasoner); // bütçe yok
    await checker.check(topic, { lastEventDescription: null });
    expect(calls.length).toBe(2);
  });
});
