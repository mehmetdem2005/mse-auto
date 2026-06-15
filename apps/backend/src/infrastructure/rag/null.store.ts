import type { RagHit, RagStore } from "../../domain/rag";

/**
 * DB yok (dev/in-memory) ya da migration 0020 uygulanmamış → RAG dormant (ADR-143).
 * `available=false` ile çağıranlar RAG'i atlar; yine de çağrılırsa upsert no-op, query boş döner.
 */
export class NullRagStore implements RagStore {
  readonly available = false;
  async upsert(): Promise<void> {}
  async query(): Promise<RagHit[]> {
    return [];
  }
}
