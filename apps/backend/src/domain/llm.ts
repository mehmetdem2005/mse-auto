/**
 * LLM model kataloğu (ADR-095) — admin'in seçebileceği global modeller.
 * Katalog SAF veridir (domain); anahtar mevcudiyeti container/route katmanında
 * eklenir. Kimlik biçimi: "<provider>/<model>".
 *
 * DeepSeek model adları canlı /models ucundan doğrulandı (2026-06-12):
 * deepseek-v4-flash, deepseek-v4-pro; "deepseek-reasoner" alias'ı V4-Flash'ın
 * düşünme (thinking) modudur ve chat ucunda çalışır.
 */
export type LlmProvider = "groq" | "deepseek";

export interface LlmModelSpec {
  id: string;
  provider: LlmProvider;
  /** Sağlayıcıya giden gerçek model adı. */
  model: string;
  label: string;
  /** Dürüst beklenti notu (hız/derinlik/maliyet) — pazarlama değil. */
  note: string;
  /** Düşünme modu: JSON kipi kapatılır, tolerant ayrıştırma + geniş token payı. */
  reasoning?: boolean;
}

export const LLM_MODEL_CATALOG: readonly LlmModelSpec[] = [
  {
    id: "groq/llama-3.3-70b-versatile",
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    label: "Llama 3.3 70B (Groq)",
    note: "Hızlı, ücretsiz kota — bugünkü varsayılan.",
  },
  {
    id: "deepseek/deepseek-v4-flash",
    provider: "deepseek",
    model: "deepseek-v4-flash",
    label: "DeepSeek V4 Flash",
    note: "Hızlı ve ekonomik; JSON modu destekli.",
  },
  {
    id: "deepseek/deepseek-v4-pro",
    provider: "deepseek",
    model: "deepseek-v4-pro",
    label: "DeepSeek V4 Pro",
    note: "Daha derin muhakeme; Flash'tan yavaş ve pahalı.",
  },
  {
    id: "deepseek/deepseek-reasoner",
    provider: "deepseek",
    model: "deepseek-reasoner",
    label: "DeepSeek Reasoner",
    note: "V4 düşünme modu — en derin; en yavaş, token tüketimi yüksek.",
    reasoning: true,
  },
];

export function findLlmModel(id: string): LlmModelSpec | undefined {
  return LLM_MODEL_CATALOG.find((m) => m.id === id);
}

/** Varsayılan model: bugünkü davranışı korur (Groq varsa Groq, yoksa DeepSeek Flash). */
export function defaultLlmModelId(avail: Record<LlmProvider, boolean>): string | null {
  if (avail.groq) return "groq/llama-3.3-70b-versatile";
  if (avail.deepseek) return "deepseek/deepseek-v4-flash";
  return null;
}
