import type { SettingsRepository } from "../domain/settings";

const KEY = "email.compose";

/**
 * Varsayılan e-posta besteci sistemi istemi (ADR-109). Kaliteli, uydurmasız, JSON çıktılı.
 * LLM ham uyarıyı (başlık+metin) profesyonel bir e-postaya çevirir.
 */
export const DEFAULT_EMAIL_PROMPT = `Sen Whenly'nin bildirim editörüsün. Sana bir izleme uyarısının ham BAŞLIK ve METNİ verilir; bunu son kullanıcıya gidecek PROFESYONEL, kısa ve net bir e-postaya dönüştür.

KURALLAR:
- ASLA yeni bilgi/olgu UYDURMA. Yalnız verilen başlık ve metindeki bilgiyi kullan; bilgi eksikse genel ama dürüst yaz.
- Ton: profesyonel, sakin, güven veren. Clickbait/abartı YOK, emoji YOK.
- Dil: GİRDİYLE AYNI dil (kullanıcı hangi dildeyse o dilde yaz).
- Uzunluk: gövde en fazla ~120 kelime; tek net mesaj + (varsa) atılabilecek adım için en çok bir cümle.
- Yapı: kısa açılış (ne oldu) → 1-2 cümle ayrıntı → kapanışta "— Whenly".
- ÇIKTI: YALNIZCA şu JSON, başka hiçbir metin olmadan: {"subject":"...","body":"..."}
  subject ≤ 80 karakter; body düz metin (HTML değil).`;

export interface EmailPromptConfig {
  useDefault: boolean;
  /** Etkin istem (varsayılan açıksa varsayılan metin; değilse özel metin). */
  prompt: string;
  defaultPrompt: string;
  persisted: boolean;
}

function readStored(v: unknown): { useDefault: boolean; custom: string } {
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return {
      useDefault: o.useDefault !== false, // eksik = varsayılan kullan
      custom: typeof o.prompt === "string" ? o.prompt : "",
    };
  }
  return { useDefault: true, custom: "" };
}

export async function getEmailPromptConfig(
  settings: SettingsRepository,
): Promise<EmailPromptConfig> {
  const { useDefault, custom } = readStored(await settings.get(KEY));
  const prompt = useDefault || !custom ? DEFAULT_EMAIL_PROMPT : custom;
  return { useDefault, prompt, defaultPrompt: DEFAULT_EMAIL_PROMPT, persisted: true };
}

export async function setEmailPromptConfig(
  settings: SettingsRepository,
  input: { useDefault: boolean; prompt: string },
): Promise<EmailPromptConfig> {
  const custom = input.prompt.trim();
  const persisted = await settings.set(KEY, { useDefault: input.useDefault, prompt: custom });
  const prompt = input.useDefault || !custom ? DEFAULT_EMAIL_PROMPT : custom;
  return { useDefault: input.useDefault, prompt, defaultPrompt: DEFAULT_EMAIL_PROMPT, persisted };
}

/** Teslim anında composer'ın kullanacağı etkin sistem istemi (varsayılan veya özel). */
export async function getEffectiveEmailPrompt(settings: SettingsRepository): Promise<string> {
  return (await getEmailPromptConfig(settings)).prompt;
}
