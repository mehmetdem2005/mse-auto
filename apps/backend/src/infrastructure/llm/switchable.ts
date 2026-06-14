/**
 * Seçilebilir LLM adapter'ları (ADR-095) — her çağrıda router'dan aktif modeli
 * okuyup ilgili sağlayıcıya yönlendirir. Böylece admin model değiştirdiğinde
 * süreç yeniden başlatılmadan TÜM kullanıcılar yeni modelle çalışır.
 */
import { z } from "zod";
import { LlmModelError } from "../../application/llm-config";
import type {
  AssistantMessage,
  AssistantReply,
  IntentAssistant,
} from "../../domain/intent-assistant";
import type { LlmModelSpec } from "../../domain/llm";
import type { EventReasoner, ReasonInput, ReasonResult } from "../../domain/reasoner";
import type { EventVerifier, VerifyInput, VerifyResult } from "../../domain/verifier";
import { type LlmChatMessage, extractJson, openaiJsonChat } from "./openai-json";
import {
  ASSISTANT_SYSTEM,
  assistantLangRule,
  buildReasonPrompt,
  buildVerifyPrompt,
} from "./prompts";

export interface ProviderKeys {
  groq?: string | undefined;
  deepseek?: string | undefined;
}

/** Router'ın çağrı-anı görünümü — application katmanındaki LlmModelRouter uyar. */
export interface ActiveModelSource {
  activeSpec(): Promise<LlmModelSpec | null>;
}

interface CallOpts {
  temperature: number;
  maxTokens: number;
}

/** Aktif modele göre tek sohbet çağrısı — sağlayıcı farkları burada kapanır. */
async function chatWithActive(
  source: ActiveModelSource,
  keys: ProviderKeys,
  messages: LlmChatMessage[],
  opts: CallOpts,
): Promise<{ content: string; tokensUsed: number | null }> {
  const spec = await source.activeSpec();
  if (!spec) throw new LlmModelError("Aktif LLM modeli yok (anahtar tanımsız).");
  const apiKey = keys[spec.provider];
  if (!apiKey) throw new LlmModelError(`${spec.provider} anahtarı tanımsız.`);
  if (spec.provider === "groq") {
    return openaiJsonChat({
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey,
      model: spec.model,
      messages,
      ...opts,
    });
  }
  const reasoning = spec.reasoning === true;
  return openaiJsonChat({
    baseUrl: "https://api.deepseek.com",
    apiKey,
    model: spec.model,
    messages,
    jsonMode: !reasoning,
    ...(reasoning ? {} : { deepseekThinking: "disabled" as const }),
    temperature: opts.temperature,
    // Düşünme modunda akıl-yürütme token'ları da bütçeden düşer → geniş pay.
    maxTokens: reasoning ? Math.max(opts.maxTokens * 4, 4096) : opts.maxTokens,
  });
}

const ReasonSchema = z.object({
  detected: z.boolean(),
  description: z.string().nullable(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
});

const EmailComposeSchema = z.object({ subject: z.string().min(1), body: z.string().min(1) });

/**
 * E-posta besteci (ADR-109) — aktif modelle ham uyarıyı profesyonel e-postaya çevirir.
 * Sistem istemi admin-ayarlı (varsayılan veya özel). LLM/parse hatasında HAM metne düşer
 * (dayanıklılık: e-posta teslimi LLM yüzünden hiç düşmez).
 */
export class SwitchableEmailComposer {
  constructor(
    private readonly source: ActiveModelSource,
    private readonly keys: ProviderKeys,
    private readonly getPrompt: () => Promise<string>,
  ) {}

  async compose(input: { title: string; body: string }): Promise<{ title: string; body: string }> {
    try {
      const system = await this.getPrompt();
      const { content } = await chatWithActive(
        this.source,
        this.keys,
        [
          { role: "system", content: system },
          { role: "user", content: `Başlık: ${input.title}\nMetin: ${input.body}` },
        ],
        { temperature: 0.3, maxTokens: 512 },
      );
      const parsed = EmailComposeSchema.parse(extractJson(content));
      return { title: parsed.subject, body: parsed.body };
    } catch {
      return input; // LLM yok/hata/parse → ham metin
    }
  }
}

export class SwitchableEventReasoner implements EventReasoner {
  constructor(
    private readonly source: ActiveModelSource,
    private readonly keys: ProviderKeys,
  ) {}

  async reason(input: ReasonInput): Promise<ReasonResult> {
    const { system, user } = buildReasonPrompt(input);
    const { content, tokensUsed } = await chatWithActive(
      this.source,
      this.keys,
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { temperature: 0, maxTokens: 1024 },
    );
    return { ...ReasonSchema.parse(extractJson(content)), tokensUsed };
  }
}

const VerifySchema = z.object({
  confirmed: z.boolean(),
  reason: z.string(),
});

export class SwitchableEventVerifier implements EventVerifier {
  constructor(
    private readonly source: ActiveModelSource,
    private readonly keys: ProviderKeys,
  ) {}

  async verify(input: VerifyInput): Promise<VerifyResult> {
    const { system, user } = buildVerifyPrompt(input);
    const { content, tokensUsed } = await chatWithActive(
      this.source,
      this.keys,
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { temperature: 0, maxTokens: 512 },
    );
    return { ...VerifySchema.parse(extractJson(content)), tokensUsed };
  }
}

const ReplySchema = z.object({
  ready: z.boolean(),
  message: z.string().min(1),
  intent: z.string().nullable(),
  frequencyMinutes: z.number().int().positive().nullable(),
  confidence: z.number().min(0).max(1),
  // ADR-110: arama planı (model üretmezse opsiyonel — eski davranış bozulmaz).
  searchQuery: z.string().nullable().optional(),
  searchMethods: z.array(z.string()).optional(),
  feasibility: z.string().nullable().optional(),
});

export class SwitchableIntentAssistant implements IntentAssistant {
  constructor(
    private readonly source: ActiveModelSource,
    private readonly keys: ProviderKeys,
  ) {}

  async chat(
    history: AssistantMessage[],
    lang?: string,
    userContext?: string,
  ): Promise<AssistantReply> {
    // ADR-113: kullanıcı kişiselleştirmesi (kendini tanıt + ek dikkat) sistem istemine eklenir.
    const ctx = userContext?.trim()
      ? `\n\nUSER PERSONALIZATION (apply when relevant; never invent beyond it):\n${userContext.trim()}`
      : "";
    const { content } = await chatWithActive(
      this.source,
      this.keys,
      [{ role: "system", content: ASSISTANT_SYSTEM + assistantLangRule(lang) + ctx }, ...history],
      // Düşük sıcaklık (ADR-074): kurallara sadık, detay uydurmasını azaltır.
      { temperature: 0.1, maxTokens: 512 },
    );
    return ReplySchema.parse(extractJson(content));
  }
}
