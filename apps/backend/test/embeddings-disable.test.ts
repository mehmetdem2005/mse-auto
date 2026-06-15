import { describe, expect, it, vi } from "vitest";
import { EMBEDDING_DISABLED, EmbeddingRouter } from "../src/application/embeddings-config";

// ADR-145 — admin gömmeyi açıkça "Pasif" yapabilir (active=null); anahtar silinmez.
function settings(initial?: string) {
  const m = new Map<string, unknown>();
  if (initial !== undefined) m.set("embeddings.active", initial);
  return {
    get: vi.fn(async (k: string) => m.get(k) ?? null),
    set: vi.fn(async (k: string, v: unknown) => {
      m.set(k, v);
      return true;
    }),
  };
}

describe("gömme aktif/pasif (ADR-145)", () => {
  it("setActive('none') → active null + 'none' kalıcı yazılır", async () => {
    const s = settings();
    const r = new EmbeddingRouter(s, { gemini: false, openai: true }, 0);
    const cfg = await r.setActive(EMBEDDING_DISABLED);
    expect(cfg.active).toBeNull();
    expect(s.set).toHaveBeenCalledWith("embeddings.active", "none");
  });

  it("kayıtlı 'none' → openai key olsa bile varsayılana DÜŞMEZ (pasif kalır)", async () => {
    const r = new EmbeddingRouter(settings("none"), { gemini: false, openai: true }, 0);
    expect((await r.getConfig()).active).toBeNull();
    expect(await r.activeSpec()).toBeNull();
  });

  it("kayıt yok + openai key → varsayılan openai aktif (geri-uyum korunur)", async () => {
    const r = new EmbeddingRouter(settings(), { gemini: false, openai: true }, 0);
    expect((await r.getConfig()).active).toBe("openai/text-embedding-3-small");
  });
});
