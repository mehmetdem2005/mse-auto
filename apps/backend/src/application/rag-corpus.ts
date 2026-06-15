import type { EmbeddingProvider } from "../domain/embeddings";
import type { MonitoringRepository } from "../domain/monitoring";
import type { RagStore } from "../domain/rag";
import type { SettingsRepository } from "../domain/settings";
import { EmbeddingConfigError } from "./embeddings-config";
import { indexDocuments } from "./rag-index";

/** RAG korpus kaynak türü (embeddings.source_type). M3.2: yalnız tespitler; ileride check_runs/site-policy. */
const SOURCE_DETECTION = "detection_event";
/** Watermark anahtarı (app_settings) — en son indekslenen tespitin detected_at'ı. */
const WATERMARK_KEY = "rag.detection_watermark";

export interface RagCorpusDeps {
  monitoring: Pick<MonitoringRepository, "listDetectionEventsSince">;
  embedder: EmbeddingProvider;
  rag: RagStore;
  settings: SettingsRepository;
}

/**
 * RAG korpus indeksleme (ADR-144 / M3.2) — yeni tespit olaylarını göm + embeddings'e upsert (batch).
 * Watermark (app_settings): yalnız son indekslemeden SONRAKİ olaylar işlenir → her olay ~bir kez gömülür
 * (maliyet bilinci). Idempotent upsert (source_type+source_id) çakışmaları güvenli kılar. Depo dormant
 * (DB yok) ya da gömme anahtarı yok (EmbeddingConfigError) → graceful 0 (watermark ilerlemez, sonra tekrar denenir).
 */
export async function indexNewDetectionEvents(deps: RagCorpusDeps, limit = 50): Promise<number> {
  if (!deps.rag.available) return 0;
  const stored = await deps.settings.get(WATERMARK_KEY);
  const since = typeof stored === "string" ? stored : new Date(0).toISOString();
  const events = await deps.monitoring.listDetectionEventsSince(since, limit);
  if (events.length === 0) return 0;

  const docs = events.map((e) => ({
    sourceType: SOURCE_DETECTION,
    sourceId: e.id,
    content: e.description,
  }));
  try {
    const n = await indexDocuments({ embedder: deps.embedder, rag: deps.rag }, docs);
    // Watermark'ı işlenen en yeni olaya ilerlet (liste en eski→yeni sıralı).
    const newest = events.reduce((m, e) => (e.detectedAt > m ? e.detectedAt : m), since);
    await deps.settings.set(WATERMARK_KEY, newest);
    return n;
  } catch (err) {
    // Gömme anahtarı yoksa RAG dormant — sessizce atla (watermark ilerlemez; anahtar gelince indekslenir).
    if (err instanceof EmbeddingConfigError) return 0;
    throw err;
  }
}
