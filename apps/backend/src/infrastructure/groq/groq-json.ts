/**
 * Groq (OpenAI-uyumlu) JSON-modu sohbet çağrısı — reasoner ve niyet asistanının
 * paylaştığı tek HTTP istemcisi. Yanıtın ham `content` string'ini döndürür;
 * şema doğrulaması çağırana aittir.
 */

export interface GroqChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { total_tokens?: number };
}

export interface GroqChatOpts {
  apiKey: string;
  model: string;
  messages: GroqChatMessage[];
  temperature: number;
  maxTokens: number;
  fetchImpl?: typeof fetch;
}

/** İçerik + token kullanımı (ADR-077/A3 — maliyet izi). */
export async function groqJsonChatWithUsage(
  opts: GroqChatOpts,
): Promise<{ content: string; tokensUsed: number | null }> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const res = await fetchImpl("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${opts.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      response_format: { type: "json_object" },
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
    }),
  });
  if (!res.ok) throw new Error(`groq ${res.status}`);
  const data = (await res.json()) as GroqResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("groq boş içerik");
  return { content, tokensUsed: data.usage?.total_tokens ?? null };
}

/** Geriye uyum: yalnız içerik. */
export async function groqJsonChat(opts: GroqChatOpts): Promise<string> {
  return (await groqJsonChatWithUsage(opts)).content;
}
