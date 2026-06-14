/**
 * OpenAI-uyumlu sohbet istemcisi (ADR-095) — Groq ve DeepSeek'in paylaştığı TEK HTTP yolu.
 *  - openaiJsonChat: response_format json_object (şema doğrulaması çağırana ait).
 *  - openaiToolChat (ADR-122): function-calling — `tools` gönderir, `tool_calls` ayrıştırır.
 * Sağlayıcı farkları parametreyle taşınır (jsonMode / deepseekThinking).
 */
import type { ToolCall, ToolChatMessage, ToolDef } from "../../domain/agent";

export interface LlmChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface RawToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}
interface RawMessage {
  content?: string | null;
  tool_calls?: RawToolCall[];
}
interface ChatResponse {
  choices?: Array<{ message?: RawMessage }>;
  usage?: { total_tokens?: number };
}

export interface OpenAiJsonChatOpts {
  baseUrl: string; // ör. https://api.groq.com/openai/v1 · https://api.deepseek.com
  apiKey: string;
  model: string;
  messages: LlmChatMessage[];
  temperature: number;
  maxTokens: number;
  jsonMode?: boolean; // varsayılan true
  deepseekThinking?: "disabled"; // yalnız DeepSeek v4-flash/pro'da gönderilir
  fetchImpl?: typeof fetch;
}

/** LLM çağrısı üst sınırı — asılı kalan istek bunu aşınca iptal edilir → çağıran fallback'e düşer. */
const LLM_TIMEOUT_MS = 25_000;

/** Paylaşılan POST /chat/completions — zaman aşımı + hata + mesaj çıkarımı (ADR-118 timeout). */
async function postCompletions(
  fetchImpl: typeof fetch,
  baseUrl: string,
  apiKey: string,
  body: Record<string, unknown>,
): Promise<{ message: RawMessage; tokensUsed: number | null }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LLM_TIMEOUT_MS);
  try {
    const res = await fetchImpl(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`llm ${new URL(baseUrl).hostname} ${res.status}`);
    const data = (await res.json()) as ChatResponse;
    const message = data.choices?.[0]?.message;
    if (!message) throw new Error("llm boş yanıt");
    return { message, tokensUsed: data.usage?.total_tokens ?? null };
  } finally {
    clearTimeout(timer);
  }
}

export async function openaiJsonChat(
  opts: OpenAiJsonChatOpts,
): Promise<{ content: string; tokensUsed: number | null }> {
  const { message, tokensUsed } = await postCompletions(
    opts.fetchImpl ?? fetch,
    opts.baseUrl,
    opts.apiKey,
    {
      model: opts.model,
      messages: opts.messages,
      ...(opts.jsonMode !== false ? { response_format: { type: "json_object" } } : {}),
      ...(opts.deepseekThinking ? { thinking: { type: opts.deepseekThinking } } : {}),
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
    },
  );
  if (!message.content) throw new Error("llm boş içerik");
  return { content: message.content, tokensUsed };
}

export interface OpenAiToolChatOpts {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ToolChatMessage[];
  tools: ToolDef[];
  temperature: number;
  maxTokens: number;
  deepseekThinking?: "disabled";
  fetchImpl?: typeof fetch;
}

/** Araç-çağıran sohbet (ADR-122): `tools` + `tool_choice:auto` gönderir, `tool_calls`'ı ayrıştırır. */
export async function openaiToolChat(
  opts: OpenAiToolChatOpts,
): Promise<{ content: string | null; toolCalls: ToolCall[]; tokensUsed: number | null }> {
  const { message, tokensUsed } = await postCompletions(
    opts.fetchImpl ?? fetch,
    opts.baseUrl,
    opts.apiKey,
    {
      model: opts.model,
      messages: opts.messages,
      tools: opts.tools,
      tool_choice: "auto",
      ...(opts.deepseekThinking ? { thinking: { type: opts.deepseekThinking } } : {}),
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
    },
  );
  const toolCalls: ToolCall[] = (message.tool_calls ?? []).map((tc) => ({
    id: tc.id,
    name: tc.function.name,
    arguments: tc.function.arguments,
  }));
  return { content: message.content ?? null, toolCalls, tokensUsed };
}

/**
 * Tolerant JSON ayrıştırma — reasoning modelleri JSON'u düz metin içinde döndürebilir;
 * ilk "{" ile son "}" arasını dener. Başarısızsa fırlatır.
 */
export function extractJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(content.slice(start, end + 1));
    throw new Error("llm yanıtında JSON bulunamadı");
  }
}
