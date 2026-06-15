import { describe, expect, it, vi } from "vitest";
import { indexDocuments } from "../src/application/rag-index";
import type { EmbeddingProvider } from "../src/domain/embeddings";
import { type RagDocument, type RagStore, toVectorLiteral } from "../src/domain/rag";
import { NullRagStore } from "../src/infrastructure/rag/null.store";

// ADR-143 (M3.1) — RAG depolama portu + yazım yolu (göm + upsert). pgvector adapteri canlı DB ister
// (yerelde test edilemez); burada saf util + NullStore + indexDocuments akışı mock'la doğrulanır.
const embedderOf = (fn: (texts: string[]) => Promise<number[][]>): EmbeddingProvider => ({
  embed: vi.fn(fn),
});

describe("RAG depolama (ADR-143)", () => {
  it("toVectorLiteral → pgvector metin gösterimi", () => {
    expect(toVectorLiteral([0.1, 0.2, -0.3])).toBe("[0.1,0.2,-0.3]");
    expect(toVectorLiteral([])).toBe("[]");
  });

  it("NullRagStore dormant: available=false, query boş, upsert no-op", async () => {
    const s = new NullRagStore();
    expect(s.available).toBe(false);
    expect(await s.query([0.1], 5)).toEqual([]);
    await expect(s.upsert([])).resolves.toBeUndefined();
  });

  it("indexDocuments: available depo → göm + upsert; saklanan sayı döner", async () => {
    const embedder = embedderOf(async (texts) => texts.map((_, i) => [i, i + 1]));
    const upsert = vi.fn(async () => {});
    const rag: RagStore = { available: true, upsert, query: async () => [] };
    const docs: RagDocument[] = [
      { sourceType: "detection_event", sourceId: "a", content: "deprem oldu" },
      { sourceType: "detection_event", sourceId: "b", content: "fiyat düştü" },
    ];
    const n = await indexDocuments({ embedder, rag }, docs);
    expect(n).toBe(2);
    expect(embedder.embed).toHaveBeenCalledWith(["deprem oldu", "fiyat düştü"]);
    expect(upsert).toHaveBeenCalledOnce();
    const written = upsert.mock.calls[0]?.[0] as (RagDocument & { embedding: number[] })[];
    expect(written[0]).toMatchObject({ sourceId: "a", embedding: [0, 1] });
  });

  it("indexDocuments: dormant depo → embed çağrılmaz, 0 döner", async () => {
    const embedder = embedderOf(async () => []);
    const n = await indexDocuments({ embedder, rag: new NullRagStore() }, [
      { sourceType: "x", sourceId: "1", content: "y" },
    ]);
    expect(n).toBe(0);
    expect(embedder.embed).not.toHaveBeenCalled();
  });

  it("indexDocuments: embedding üretilemeyen belge atlanır", async () => {
    const embedder = embedderOf(async (texts) => texts.map((_, i) => (i === 0 ? [1, 2] : [])));
    const upsert = vi.fn(async () => {});
    const rag: RagStore = { available: true, upsert, query: async () => [] };
    const n = await indexDocuments({ embedder, rag }, [
      { sourceType: "t", sourceId: "1", content: "a" },
      { sourceType: "t", sourceId: "2", content: "b" },
    ]);
    expect(n).toBe(1);
    const written = upsert.mock.calls[0]?.[0] as unknown[];
    expect(written).toHaveLength(1);
  });
});
