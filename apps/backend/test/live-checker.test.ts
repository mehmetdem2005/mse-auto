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

  it("lastEventDescription muhakemeye iletilir (tekrar-bastırma)", async () => {
    const { reasoner, seen } = spyReasoner();
    const c = new LiveChecker(provider({ general: [hit("g")] }), reasoner);
    await c.check(topic, { lastEventDescription: "önceki olay" });
    expect(seen[0]?.lastEventDescription).toBe("önceki olay");
  });
});
