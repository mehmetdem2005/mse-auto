import { describe, expect, it, vi } from "vitest";
import { EmbeddingConfigError } from "../src/application/embeddings-config";
import { indexNewDetectionEvents } from "../src/application/rag-corpus";
import type { EmbeddingProvider } from "../src/domain/embeddings";
import type { DetectionEventView } from "../src/domain/monitoring";
import type { RagStore } from "../src/domain/rag";

// ADR-144 (M3.2) — RAG korpus indeksleme: watermark'lı, dormant/no-key graceful.
const evt = (id: string, at: string): DetectionEventView => ({
  id,
  description: `olay ${id}`,
  detectedAt: at,
  facts: null,
});

function fakeSettings(initial?: string) {
  const store = new Map<string, unknown>();
  if (initial) store.set("rag.detection_watermark", initial);
  return {
    get: vi.fn(async (k: string) => store.get(k) ?? null),
    set: vi.fn(async (k: string, v: unknown) => {
      store.set(k, v);
      return true;
    }),
  };
}
const okEmbedder = (): EmbeddingProvider => ({
  embed: vi.fn(async (t: string[]) => t.map(() => [0.1, 0.2])),
});

describe("RAG korpus indeksleme (ADR-144)", () => {
  it("dormant depo → 0, monitoring'e dokunmaz", async () => {
    const monitoring = { listDetectionEventsSince: vi.fn() };
    const rag: RagStore = { available: false, upsert: vi.fn(), query: async () => [] };
    const n = await indexNewDetectionEvents({
      monitoring,
      embedder: okEmbedder(),
      rag,
      settings: fakeSettings(),
    });
    expect(n).toBe(0);
    expect(monitoring.listDetectionEventsSince).not.toHaveBeenCalled();
  });

  it("yeni olayları gömüp upsert eder + watermark'ı en yeniye ilerletir", async () => {
    const events = [evt("a", "2026-06-01T00:00:00Z"), evt("b", "2026-06-02T00:00:00Z")];
    const monitoring = { listDetectionEventsSince: vi.fn(async () => events) };
    const upsert = vi.fn(async () => {});
    const rag: RagStore = { available: true, upsert, query: async () => [] };
    const settings = fakeSettings();
    const n = await indexNewDetectionEvents({ monitoring, embedder: okEmbedder(), rag, settings });
    expect(n).toBe(2);
    // watermark = en yeni detectedAt
    expect(settings.set).toHaveBeenCalledWith("rag.detection_watermark", "2026-06-02T00:00:00Z");
    const written = upsert.mock.calls[0]?.[0] as { sourceType: string; sourceId: string }[];
    expect(written.map((w) => w.sourceId)).toEqual(["a", "b"]);
    expect(written[0]?.sourceType).toBe("detection_event");
  });

  it("watermark'tan beri yeni olay yok → 0, gömme/yazma yok", async () => {
    const monitoring = { listDetectionEventsSince: vi.fn(async () => []) };
    const embedder = okEmbedder();
    const rag: RagStore = { available: true, upsert: vi.fn(), query: async () => [] };
    const n = await indexNewDetectionEvents({
      monitoring,
      embedder,
      rag,
      settings: fakeSettings("2026-06-02T00:00:00Z"),
    });
    expect(n).toBe(0);
    expect(embedder.embed).not.toHaveBeenCalled();
  });

  it("gömme anahtarı yok (EmbeddingConfigError) → 0, watermark İLERLEMEZ", async () => {
    const monitoring = {
      listDetectionEventsSince: vi.fn(async () => [evt("a", "2026-06-01T00:00:00Z")]),
    };
    const embedder: EmbeddingProvider = {
      embed: vi.fn(async () => {
        throw new EmbeddingConfigError("anahtar yok");
      }),
    };
    const rag: RagStore = { available: true, upsert: vi.fn(), query: async () => [] };
    const settings = fakeSettings();
    const n = await indexNewDetectionEvents({ monitoring, embedder, rag, settings });
    expect(n).toBe(0);
    expect(settings.set).not.toHaveBeenCalled();
  });
});
