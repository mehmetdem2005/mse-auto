import type { LlmConfig, LlmModel } from "@watcher/contracts";
import {
  LLM_MODEL_CATALOG,
  type LlmModelSpec,
  type LlmProvider,
  defaultLlmModelId,
  findLlmModel,
} from "../domain/llm";
import type { SettingsRepository } from "../domain/settings";

const SETTINGS_KEY = "llm.active";

/** Hata mesajları route'ta 400 gövdesine yazılır (kullanıcıya dürüst sebep). */
export class LlmModelError extends Error {}

/**
 * Global LLM model yönlendiricisi (ADR-095). Admin'in seçtiği model TÜM
 * kullanıcılar için reasoner + verifier + asistanı sürer. Seçim app_settings'te
 * kalıcıdır; tablo yoksa (migration 0014 bekliyor) bellekte yaşar ve bu durum
 * persisted=false ile DÜRÜSTÇE raporlanır. Çok-instance senaryosu için kısa
 * TTL'le yeniden okunur.
 */
export class LlmModelRouter {
  private activeId: string | null;
  private persisted = false;
  private loadedAt = 0;

  constructor(
    private readonly settings: SettingsRepository,
    private readonly availability: Record<LlmProvider, boolean>,
    private readonly ttlMs = 10_000,
  ) {
    this.activeId = defaultLlmModelId(availability);
  }

  private isAvailable(spec: LlmModelSpec): boolean {
    return this.availability[spec.provider];
  }

  private async load(force = false): Promise<void> {
    if (!force && Date.now() - this.loadedAt < this.ttlMs) return;
    this.loadedAt = Date.now();
    const stored = await this.settings.get(SETTINGS_KEY);
    if (typeof stored === "string") {
      const spec = findLlmModel(stored);
      // Saklanan model artık katalogda/anahtarda yoksa varsayılana düş (dürüst).
      if (spec && this.isAvailable(spec)) {
        this.activeId = stored;
        this.persisted = true;
        return;
      }
    }
    if (stored === null && this.activeId === defaultLlmModelId(this.availability)) {
      // Hiç seçim yapılmamış: varsayılan geçerli, persisted=false anlamlı değil —
      // ilk PUT'a dek "varsayılan" durumunda kalır.
      this.persisted = false;
    }
  }

  /** Çağrı anındaki aktif model (checker/asistan bunu kullanır). */
  async activeSpec(): Promise<LlmModelSpec | null> {
    await this.load();
    if (!this.activeId) return null;
    const spec = findLlmModel(this.activeId);
    return spec && this.isAvailable(spec) ? spec : null;
  }

  /** Admin görünümü: aktif + katalog (anahtar mevcudiyetiyle). */
  async getConfig(): Promise<LlmConfig> {
    await this.load();
    const models: LlmModel[] = LLM_MODEL_CATALOG.map((m) => ({
      id: m.id,
      provider: m.provider,
      model: m.model,
      label: m.label,
      note: m.note,
      available: this.isAvailable(m),
    }));
    return { active: this.activeId, persisted: this.persisted, models };
  }

  async setActive(id: string): Promise<LlmConfig> {
    const spec = findLlmModel(id);
    if (!spec) throw new LlmModelError(`Bilinmeyen model: ${id}`);
    if (!this.isAvailable(spec)) {
      throw new LlmModelError(
        `${spec.label} için API anahtarı tanımlı değil (${spec.provider === "groq" ? "GROQ_API_KEY" : "DEEPSEEK_API_KEY"}).`,
      );
    }
    this.persisted = await this.settings.set(SETTINGS_KEY, id);
    this.activeId = id;
    this.loadedAt = Date.now();
    return this.getConfig();
  }
}
