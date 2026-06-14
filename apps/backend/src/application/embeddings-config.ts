import type { EmbeddingConfig, EmbeddingModel } from "@watcher/contracts";
import {
  EMBEDDING_CATALOG,
  type EmbeddingModelSpec,
  type EmbeddingProviderId,
  defaultEmbeddingId,
  findEmbeddingModel,
} from "../domain/embeddings";
import type { SettingsRepository } from "../domain/settings";

const SETTINGS_KEY = "embeddings.active";

/** Hata mesajları route'ta 400 gövdesine yazılır. */
export class EmbeddingConfigError extends Error {}

/**
 * Global gömme sağlayıcı yönlendiricisi (ADR-127) — `LlmModelRouter` ile AYNI desen. Admin'in
 * seçtiği gömme modeli RAG çağrılarını sürer; seçim `app_settings['embeddings.active']`'te kalıcı
 * (tablo yoksa bellekte, persisted=false ile dürüstçe). Anahtarı olmayan sağlayıcı seçilemez.
 */
export class EmbeddingRouter {
  private activeId: string | null;
  private persisted = false;
  private loadedAt = 0;

  constructor(
    private readonly settings: SettingsRepository,
    private readonly availability: Record<EmbeddingProviderId, boolean>,
    private readonly ttlMs = 10_000,
  ) {
    this.activeId = defaultEmbeddingId(availability);
  }

  private isAvailable(spec: EmbeddingModelSpec): boolean {
    return this.availability[spec.provider];
  }

  private async load(): Promise<void> {
    if (Date.now() - this.loadedAt < this.ttlMs) return;
    this.loadedAt = Date.now();
    const stored = await this.settings.get(SETTINGS_KEY);
    if (typeof stored === "string") {
      const spec = findEmbeddingModel(stored);
      if (spec && this.isAvailable(spec)) {
        this.activeId = stored;
        this.persisted = true;
      }
    }
  }

  /** Çağrı anındaki aktif gömme modeli (RAG bunu kullanır). */
  async activeSpec(): Promise<EmbeddingModelSpec | null> {
    await this.load();
    if (!this.activeId) return null;
    const spec = findEmbeddingModel(this.activeId);
    return spec && this.isAvailable(spec) ? spec : null;
  }

  /** Admin görünümü: aktif + katalog (anahtar mevcudiyetiyle). */
  async getConfig(): Promise<EmbeddingConfig> {
    await this.load();
    const models: EmbeddingModel[] = EMBEDDING_CATALOG.map((m) => ({
      id: m.id,
      provider: m.provider,
      model: m.model,
      label: m.label,
      note: m.note,
      dimensions: m.dimensions,
      available: this.isAvailable(m),
    }));
    return { active: this.activeId, persisted: this.persisted, models };
  }

  async setActive(id: string): Promise<EmbeddingConfig> {
    const spec = findEmbeddingModel(id);
    if (!spec) throw new EmbeddingConfigError(`Bilinmeyen gömme modeli: ${id}`);
    if (!this.isAvailable(spec)) {
      throw new EmbeddingConfigError(
        `${spec.label} için API anahtarı tanımlı değil (${spec.provider === "gemini" ? "GEMINI_API_KEY" : "OPENAI_API_KEY"}).`,
      );
    }
    this.persisted = await this.settings.set(SETTINGS_KEY, id);
    this.activeId = id;
    this.loadedAt = Date.now();
    return this.getConfig();
  }
}
