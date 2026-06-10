import { describe, expect, it } from "vitest";
import { GroqEventReasoner } from "../src/infrastructure/reasoner/groq.reasoner";

function fakeFetch(body: unknown, ok = true): typeof fetch {
  return (async () =>
    ({ ok, status: ok ? 200 : 401, json: async () => body }) as Response) as typeof fetch;
}

describe("GroqEventReasoner (OpenAI-uyumlu JSON)", () => {
  const hits = [{ title: "ÖSYM", snippet: "Giriş yerleri açıklandı", url: "x", date: null }];

  it("JSON kararını ayrıştırır (detected)", async () => {
    const body = {
      choices: [
        {
          message: {
            content:
              '{"detected":true,"description":"Giriş yerleri açıklandı","reasoning":"ÖSYM duyurdu","confidence":0.92}',
          },
        },
      ],
    };
    const r = new GroqEventReasoner("k", "llama-3.3-70b-versatile", fakeFetch(body));
    const out = await r.reason({ canonicalQuery: "yks giriş yerleri", hits });
    expect(out.detected).toBe(true);
    expect(out.confidence).toBe(0.92);
  });

  it("isteme bugünün tarihi + önceki olay gider (ADR-037/039)", async () => {
    let sentBody = "";
    const capturing: typeof fetch = (async (_u: unknown, init?: RequestInit) => {
      sentBody = String(init?.body ?? "");
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: '{"detected":false,"description":null,"reasoning":"r","confidence":0.5}',
              },
            },
          ],
        }),
      } as Response;
    }) as typeof fetch;
    const r = new GroqEventReasoner("k", "llama-3.3-70b-versatile", capturing);
    await r.reason({
      canonicalQuery: "yks giriş yerleri",
      hits,
      lastEventDescription: "Giriş yerleri açıklandı",
    });
    const today = new Date().toISOString().slice(0, 10);
    expect(sentBody).toContain(`Bugünün tarihi: ${today}`);
    expect(sentBody).toContain("Daha önce bildirilen olay: Giriş yerleri açıklandı");
  });

  it("HTTP hatası fırlatır + boş içerik fırlatır", async () => {
    const r1 = new GroqEventReasoner("k", "llama-3.3-70b-versatile", fakeFetch({}, false));
    await expect(r1.reason({ canonicalQuery: "x", hits })).rejects.toThrow(/groq 401/);
    const r2 = new GroqEventReasoner("k", "llama-3.3-70b-versatile", fakeFetch({ choices: [] }));
    await expect(r2.reason({ canonicalQuery: "x", hits })).rejects.toThrow(/boş içerik/);
  });
});
