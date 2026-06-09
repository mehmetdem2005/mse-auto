import { describe, expect, it } from "vitest";
import type { CanonicalTopic } from "../src/domain/topic";
import { OpenAiChecker } from "../src/infrastructure/checker/openai.checker";

const topic: CanonicalTopic = {
  id: "t1",
  canonicalQuery: "yks giriş yerleri açıklandı mı",
  lastCheckedAt: null,
};

function fakeFetch(body: unknown, ok = true): typeof fetch {
  return (async () =>
    ({ ok, status: ok ? 200 : 429, json: async () => body }) as Response) as typeof fetch;
}

describe("OpenAiChecker (Responses + web_search)", () => {
  it("output_text içindeki JSON kararını ayrıştırır", async () => {
    const body = {
      output_text:
        'Araştırdım. ```json\n{"detected":true,"description":"Giriş yerleri açıklandı","reasoning":"ÖSYM duyurdu","confidence":0.9}\n```',
    };
    const c = new OpenAiChecker("k", "gpt-4o", fakeFetch(body));
    const out = await c.check(topic);
    expect(out.detected).toBe(true);
    expect(out.description).toContain("açıklandı");
    expect(out.confidence).toBe(0.9);
    expect(out.resultSummary).toContain("OpenAI");
  });

  it("output[] dizisindeki mesaj metnini de okur", async () => {
    const body = {
      output: [
        { type: "web_search_call" },
        {
          type: "message",
          content: [
            {
              type: "output_text",
              text: '{"detected":false,"description":null,"reasoning":"henüz yok","confidence":0.2}',
            },
          ],
        },
      ],
    };
    const c = new OpenAiChecker("k", "gpt-4o", fakeFetch(body));
    const out = await c.check(topic);
    expect(out.detected).toBe(false);
    expect(out.description).toBeNull();
  });

  it("HTTP hatası fırlatır (kota/quota)", async () => {
    const c = new OpenAiChecker("k", "gpt-4o", fakeFetch({}, false));
    await expect(c.check(topic)).rejects.toThrow(/openai 429/);
  });
});
