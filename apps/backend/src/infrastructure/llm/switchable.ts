/**
 * Seçilebilir LLM adapter'ları (ADR-095) — her çağrıda router'dan aktif modeli
 * okuyup ilgili sağlayıcıya yönlendirir. Böylece admin model değiştirdiğinde
 * süreç yeniden başlatılmadan TÜM kullanıcılar yeni modelle çalışır.
 */
import { z } from "zod";
import { LlmModelError } from "../../application/llm-config";
import type { ToolCall, ToolChat, ToolChatMessage, ToolDef } from "../../domain/agent";
import type {
  AssistantMessage,
  AssistantReply,
  IntentAssistant,
} from "../../domain/intent-assistant";
import { type LlmModelSpec, findLlmModel } from "../../domain/llm";
import type { EventReasoner, ReasonInput, ReasonResult } from "../../domain/reasoner";
import type { EventVerifier, VerifyInput, VerifyResult } from "../../domain/verifier";
import { type LlmChatMessage, extractJson, openaiJsonChat, openaiToolChat } from "./openai-json";
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

/**
 * Sabit model kaynağı (ADR-121): niyet asistanı/ajan HER ZAMAN belirli bir modeli (deepseek-v4-pro)
 * kullanır — admin'in watcher reasoner/verifier için seçtiği modelden BAĞIMSIZ. Model katalogda
 * yoksa null döner; sağlayıcı anahtarı yoksa `chatWithActive` Groq çapraz-fallback'ine (ADR-119) düşer.
 */
export class FixedModelSource implements ActiveModelSource {
  constructor(private readonly id: string) {}
  async activeSpec(): Promise<LlmModelSpec | null> {
    return findLlmModel(this.id) ?? null;
  }
}

interface CallOpts {
  temperature: number;
  maxTokens: number;
}

/** Tek bir model spesine sohbet çağrısı — sağlayıcı (groq/deepseek) farkları burada kapanır. */
async function chatViaSpec(
  spec: LlmModelSpec,
  keys: ProviderKeys,
  messages: LlmChatMessage[],
  opts: CallOpts,
): Promise<{ content: string; tokensUsed: number | null }> {
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

/**
 * Aktif modele tek sohbet çağrısı. GEÇİCİ hatada (timeout/rate-limit/5xx/parse) ve aktif
 * sağlayıcı Groq DEĞİLse, gerçek bir İKİNCİ LLM'e (Groq Llama 3.3 70B) düşer (ADR-119) —
 * dumb sezgisel fallback'ten ÖNCE. Böylece bir sağlayıcı tökezlese de kullanıcı GERÇEK
 * LLM yanıtı alır (deepseek'in Render'dan aralıklı hatası bunu tetikliyordu).
 */
async function chatWithActive(
  source: ActiveModelSource,
  keys: ProviderKeys,
  messages: LlmChatMessage[],
  opts: CallOpts,
): Promise<{ content: string; tokensUsed: number | null }> {
  const spec = await source.activeSpec();
  if (!spec) throw new LlmModelError("Aktif LLM modeli yok (anahtar tanımsız).");
  try {
    return await chatViaSpec(spec, keys, messages, opts);
  } catch (err) {
    const groq = findLlmModel("groq/llama-3.3-70b-versatile");
    if (groq && keys.groq && spec.provider !== "groq") {
      return chatViaSpec(groq, keys, messages, opts);
    }
    throw err;
  }
}

/**
 * Aktif modele JSON çağrısı + ŞEMA DOĞRULAMASI TEK birim (ADR-126). Hem çağrı HEM parse hatası
 * Groq çapraz-fallback'ini tetikler. Eskiden parse caller'da olduğu için, v4-pro şemaya uymayan
 * içerik döndürünce fallback ATLANIYOR ve route dumb sezgisele düşüp junk niyet üretiyordu.
 */
async function chatWithActiveJson<T>(
  source: ActiveModelSource,
  keys: ProviderKeys,
  messages: LlmChatMessage[],
  opts: CallOpts,
  parse: (content: string) => T,
): Promise<{ value: T; tokensUsed: number | null }> {
  const spec = await source.activeSpec();
  if (!spec) throw new LlmModelError("Aktif LLM modeli yok (anahtar tanımsız).");
  const attempt = async (s: LlmModelSpec) => {
    const { content, tokensUsed } = await chatViaSpec(s, keys, messages, opts);
    return { value: parse(content), tokensUsed };
  };
  try {
    return await attempt(spec);
  } catch (err) {
    const groq = findLlmModel("groq/llama-3.3-70b-versatile");
    if (groq && keys.groq && spec.provider !== "groq") {
      try {
        return await attempt(groq);
      } catch {
        // groq da başarısızsa aşağıda orijinal hata fırlatılır → route sezgisele düşer.
      }
    }
    throw err;
  }
}

/** Tek model spesine ARAÇLI sohbet (ADR-122) — function-calling; sağlayıcı baseUrl/thinking farkı burada. */
async function chatViaSpecTools(
  spec: LlmModelSpec,
  keys: ProviderKeys,
  messages: ToolChatMessage[],
  tools: ToolDef[],
  opts: CallOpts,
): Promise<{ content: string | null; toolCalls: ToolCall[] }> {
  const apiKey = keys[spec.provider];
  if (!apiKey) throw new LlmModelError(`${spec.provider} anahtarı tanımsız.`);
  const baseUrl =
    spec.provider === "groq" ? "https://api.groq.com/openai/v1" : "https://api.deepseek.com";
  const { content, toolCalls } = await openaiToolChat({
    baseUrl,
    apiKey,
    model: spec.model,
    messages,
    tools,
    temperature: opts.temperature,
    maxTokens: opts.maxTokens,
    ...(spec.provider === "deepseek" && spec.reasoning !== true
      ? { deepseekThinking: "disabled" as const }
      : {}),
  });
  return { content, toolCalls };
}

/**
 * Araçlarla sohbet eden ToolChat (ADR-122) — aktif modeli (asistan için FixedModelSource = v4-pro)
 * kullanır; geçici hatada Groq'a düşer (ADR-119). Ajan döngüsü (application/agent/run-agent) bunu sürer.
 */
export class SwitchableAgentChat implements ToolChat {
  constructor(
    private readonly source: ActiveModelSource,
    private readonly keys: ProviderKeys,
  ) {}

  async chat(
    messages: ToolChatMessage[],
    tools: ToolDef[],
  ): Promise<{ content: string | null; toolCalls: ToolCall[] }> {
    const spec = await this.source.activeSpec();
    if (!spec) throw new LlmModelError("Aktif LLM modeli yok (anahtar tanımsız).");
    const opts: CallOpts = { temperature: 0.1, maxTokens: 1024 };
    try {
      return await chatViaSpecTools(spec, this.keys, messages, tools, opts);
    } catch (err) {
      const groq = findLlmModel("groq/llama-3.3-70b-versatile");
      if (groq && this.keys.groq && spec.provider !== "groq") {
        return chatViaSpecTools(groq, this.keys, messages, tools, opts);
      }
      throw err;
    }
  }
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
    const { value, tokensUsed } = await chatWithActiveJson(
      this.source,
      this.keys,
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { temperature: 0, maxTokens: 1024 },
      (content) => ReasonSchema.parse(extractJson(content)),
    );
    return { ...value, tokensUsed };
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
    const { value, tokensUsed } = await chatWithActiveJson(
      this.source,
      this.keys,
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { temperature: 0, maxTokens: 512 },
      (content) => VerifySchema.parse(extractJson(content)),
    );
    return { ...value, tokensUsed };
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
    const { value } = await chatWithActiveJson(
      this.source,
      this.keys,
      [{ role: "system", content: ASSISTANT_SYSTEM + assistantLangRule(lang) + ctx }, ...history],
      // Düşük sıcaklık (ADR-074): kurallara sadık, detay uydurmasını azaltır.
      { temperature: 0.1, maxTokens: 512 },
      (content) => ReplySchema.parse(extractJson(content)),
    );
    return value;
  }
}
