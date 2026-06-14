import { describe, expect, it } from "vitest";
import { EmbeddingConfigError, EmbeddingRouter } from "../src/application/embeddings-config";
import type { SettingsRepository } from "../src/domain/settings";
import { GeminiEmbeddings } from "../src/infrastructure/embeddings/gemini.embeddings";
import { OpenAiEmbeddings } from "../src/infrastructure/embeddings/openai.embeddings";
import { SwitchableEmbedder } from "../src/infrastructure/embeddings/switchable.embedder";

function memSettings(init: Record<string, string> = {}): SettingsRepository {
  const m = new Map<string, unknown>(Object.entries(init));
  return {
    get: async (k) => m.get(k) ?? null,
    set: async (k, v) => {
      m.set(k, v);
      return true;
    },
  };
}

describe("EmbeddingRouter (ADR-127)", () => {
  it("varsayılan: Gemini varsa Gemini (ücretsiz), yoksa OpenAI", async () => {
    const both = await new EmbeddingRouter(memSettings(), {
      gemini: true,
      openai: true,
    }).activeSpec();
    expect(both?.id).toBe("gemini/text-embedding-004");
    const onlyOpenai = await new EmbeddingRouter(memSettings(), {
      gemini: false,
      openai: true,
    }).activeSpec();
    expect(onlyOpenai?.id).toBe("openai/text-embedding-3-small");
    const none = await new EmbeddingRouter(memSettings(), {
      gemini: false,
      openai: false,
    }).activeSpec();
    expect(none).toBeNull();
  });

  it("getConfig: katalog + anahtar mevcudiyeti; 768 boyut", async () => {
    const cfg = await new EmbeddingRouter(memSettings(), {
      gemini: true,
      openai: false,
    }).getConfig();
    expect(cfg.models).toHaveLength(2);
    expect(cfg.models.every((m) => m.dimensions === 768)).toBe(true);
    expect(cfg.models.find((m) => m.provider === "openai")?.available).toBe(false);
  });

  it("setActive: bilinmeyen → hata; anahtarsız → hata; geçerli → set", async () => {
    const r = new EmbeddingRouter(memSettings(), { gemini: true, openai: false });
    await expect(r.setActive("nope/nope")).rejects.toBeInstanceOf(EmbeddingConfigError);
    await expect(r.setActive("openai/text-embedding-3-small")).rejects.toBeInstanceOf(
      EmbeddingConfigError,
    );
    const cfg = await r.setActive("gemini/text-embedding-004");
    expect(cfg.active).toBe("gemini/text-embedding-004");
    expect(cfg.persisted).toBe(true);
  });
});

describe("SwitchableEmbedder", () => {
  it("aktif sağlayıcıya yönlendirir; sağlayıcı yoksa hata", async () => {
    const fake: { embed: (t: string[]) => Promise<number[][]> } = {
      embed: async (t) => t.map(() => [0.1, 0.2]),
    };
    const router = new EmbeddingRouter(memSettings(), { gemini: true, openai: false });
    const ok = new SwitchableEmbedder(router, { gemini: fake });
    expect(await ok.embed(["a", "b"])).toEqual([
      [0.1, 0.2],
      [0.1, 0.2],
    ]);
    const missing = new SwitchableEmbedder(router, {}); // gemini aktif ama kurulu değil
    await expect(missing.embed(["x"])).rejects.toBeInstanceOf(EmbeddingConfigError);
  });
});

describe("embedding adapters — wire format (mock fetch)", () => {
  it("Gemini batchEmbedContents → values dizisi", async () => {
    const fakeFetch = (async () =>
      new Response(JSON.stringify({ embeddings: [{ values: [1, 2, 3] }, { values: [4, 5, 6] }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })) as unknown as typeof fetch;
    const g = new GeminiEmbeddings("k", "text-embedding-004", fakeFetch);
    expect(await g.embed(["a", "b"])).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });

  it("OpenAI /embeddings → data[].embedding + dimensions=768 gönderir", async () => {
    let sentBody = "";
    const fakeFetch = (async (_url: string, init: RequestInit) => {
      sentBody = String(init.body);
      return new Response(JSON.stringify({ data: [{ embedding: [7, 8] }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;
    const o = new OpenAiEmbeddings("k", "text-embedding-3-small", fakeFetch);
    expect(await o.embed(["x"])).toEqual([[7, 8]]);
    expect(JSON.parse(sentBody).dimensions).toBe(768);
  });
});
