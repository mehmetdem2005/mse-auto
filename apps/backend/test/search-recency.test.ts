import { describe, expect, it } from "vitest";
import { SerperSearchProvider } from "../src/infrastructure/search/serper.search";

/** Gönderilen istek gövdelerini yakalayan sahte fetch. */
function capturingFetch(responses: unknown[], captured: Record<string, unknown>[]): typeof fetch {
  let i = 0;
  return (async (_url: unknown, init?: RequestInit) => {
    captured.push(JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>);
    const body = responses[Math.min(i, responses.length - 1)];
    i += 1;
    return { ok: true, status: 200, json: async () => body } as Response;
  }) as typeof fetch;
}

const organic = (n: number) => ({
  organic: Array.from({ length: n }, (_, i) => ({
    title: `t${i}`,
    snippet: "s",
    link: "u",
    date: "1 gün önce",
  })),
});

describe("Serper haber araması (ADR-046)", () => {
  it("news ucuna son-24-saat (qdr:d) ile gider ve haberleri eşler", async () => {
    const captured: Record<string, unknown>[] = [];
    let url = "";
    const f: typeof fetch = (async (u: unknown, init?: RequestInit) => {
      url = String(u);
      captured.push(JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          news: [{ title: "t", snippet: "s", link: "u", date: "2 saat önce" }],
        }),
      } as Response;
    }) as typeof fetch;
    const prov = new SerperSearchProvider("k", f);
    const hits = await prov.searchNews("deneme konu");
    expect(url).toContain("/news");
    expect(captured[0]?.tbs).toBe("qdr:d");
    expect(hits[0]?.date).toBe("2 saat önce");
  });
});

describe("Serper güncellik filtresi (ADR-039)", () => {
  it("önce son-1-hafta (tbs=qdr:w) ile arar; sonuç varsa onları döner", async () => {
    const captured: Record<string, unknown>[] = [];
    const p = new SerperSearchProvider("k", capturingFetch([organic(3)], captured));
    const hits = await p.search("deneme konu");
    expect(hits).toHaveLength(3);
    expect(captured).toHaveLength(1);
    expect(captured[0]?.tbs).toBe("qdr:w");
  });

  it("haftalık arama boş dönerse filtresiz yedek arama yapar", async () => {
    const captured: Record<string, unknown>[] = [];
    const p = new SerperSearchProvider("k", capturingFetch([organic(0), organic(2)], captured));
    const hits = await p.search("deneme konu");
    expect(hits).toHaveLength(2);
    expect(captured).toHaveLength(2);
    expect(captured[0]?.tbs).toBe("qdr:w");
    expect(captured[1]?.tbs).toBeUndefined(); // yedek: filtresiz
  });
});
