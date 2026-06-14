import { EmbeddingConfigError, type EmbeddingRouter } from "../../application/embeddings-config";
import type { EmbeddingProvider, EmbeddingProviderId } from "../../domain/embeddings";

/**
 * Aktif gömme sağlayıcısına yönlendiren embedder (ADR-127). RAG bunu kullanır (Faz 5); admin
 * `embeddings.active`'i değiştirince yeniden başlatmasız geçer. Anahtar yoksa hata fırlatır
 * (RAG katmanı bunu yakalayıp bağlamsız çalışır — dormant).
 */
export class SwitchableEmbedder implements EmbeddingProvider {
  constructor(
    private readonly router: EmbeddingRouter,
    private readonly providers: Partial<Record<EmbeddingProviderId, EmbeddingProvider>>,
  ) {}

  async embed(texts: string[]): Promise<number[][]> {
    const spec = await this.router.activeSpec();
    if (!spec) throw new EmbeddingConfigError("Aktif gömme modeli yok (anahtar tanımsız).");
    const provider = this.providers[spec.provider];
    if (!provider) throw new EmbeddingConfigError(`${spec.provider} embedder kurulu değil.`);
    return provider.embed(texts);
  }
}
