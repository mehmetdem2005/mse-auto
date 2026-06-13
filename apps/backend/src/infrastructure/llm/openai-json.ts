/**
 * OpenAI-uyumlu sohbet istemcisi (ADR-095) — Groq ve DeepSeek'in paylaştığı
 * TEK HTTP yolu. Sağlayıcı farkları parametreyle taşınır:
 *  - jsonMode: response_format json_object (reasoning modellerinde kapatılır)
 *  - deepseekThinking: "disabled" → DeepSeek V4'te düşünme kapatılır (hız/maliyet)
 * Şema doğrulaması çağırana aittir; burada yalnız içerik + token sayısı döner.
 */

export interface LlmChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
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

export async function openaiJsonChat(
  opts: OpenAiJsonChatOpts,
): Promise<{ content: string; tokensUsed: number | null }> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const res = await fetchImpl(`${opts.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${opts.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      ...(opts.jsonMode !== false ? { response_format: { type: "json_object" } } : {}),
      ...(opts.deepseekThinking ? { thinking: { type: opts.deepseekThinking } } : {}),
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
    }),
  });
  if (!res.ok) throw new Error(`llm ${new URL(opts.baseUrl).hostname} ${res.status}`);
  const data = (await res.json()) as ChatResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("llm boş içerik");
  return { content, tokensUsed: data.usage?.total_tokens ?? null };
}

/**
 * Tolerant JSON ayrıştırma — reasoning modelleri JSON'u düz metin içinde
 * döndürebilir; ilk "{" ile son "}" arasını dener. Başarısızsa fırlatır.
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
