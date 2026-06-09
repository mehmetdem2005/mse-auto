import { describe, expect, it } from "vitest";
import { GeminiSearchProvider } from "../src/infrastructure/search/gemini.search";

function fakeFetch(body: unknown, ok = true): typeof fetch {
  return (async () =>
    ({ ok, status: ok ? 200 : 500, json: async () => body }) as Response) as typeof fetch;
}

describe("GeminiSearchProvider (google_search grounding)", () => {
  it("özet + kaynakları SearchHit'e map'ler", async () => {
    const resp = {
      candidates: [
        {
          content: { parts: [{ text: "YKS giriş yerleri 5 Haziran'da açıklandı." }] },
          groundingMetadata: {
            groundingChunks: [
              { web: { uri: "https://osym.gov.tr/x", title: "ÖSYM duyuru" } },
              { web: { uri: "https://haber.tr/y", title: "Haber" } },
            ],
          },
        },
      ],
    };
    const provider = new GeminiSearchProvider("k", "gemini-2.5-flash", fakeFetch(resp));
    const hits = await provider.search("yks giriş yerleri açıklandı mı");
    expect(provider.name).toBe("gemini");
    expect(hits[0].snippet).toContain("5 Haziran");
    expect(hits.filter((h) => h.url.startsWith("https://"))).toHaveLength(2);
    expect(hits.find((h) => h.url === "https://osym.gov.tr/x")?.title).toBe("ÖSYM duyuru");
  });

  it("grounding yoksa yalnız özet döner; HTTP hatası fırlatır", async () => {
    const only = { candidates: [{ content: { parts: [{ text: "Henüz açıklanmadı." }] } }] };
    const p1 = new GeminiSearchProvider("k", "gemini-2.5-flash", fakeFetch(only));
    expect(await p1.search("x")).toHaveLength(1);
    const p2 = new GeminiSearchProvider("k", "gemini-2.5-flash", fakeFetch({}, false));
    await expect(p2.search("x")).rejects.toThrow(/gemini 500/);
  });
});
