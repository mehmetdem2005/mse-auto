/**
 * Olay-bazlı fizibilite ajanı (ADR-129) — niyet asistanını GERÇEKTEN araştıran bir ajana çevirir.
 * Kullanıcı bir olay anlatınca tek-atış tahmin yerine araçlarla (web_search → resolve_authority →
 * check_site_policy) araştırır ve yapısal `feasibilityVerdict` (can/partial/cannot) + planlanan
 * adımlar + site-izni döndürür. Hata/parse-fail → tek-atış asistanına (SwitchableIntentAssistant,
 * ADR-126) düşer; o da düşerse route sezgisele iner (ADR-118). Sihirbaz HİÇ tıkanmaz.
 *
 * Model: ajan da asistan kaynağıyla (FixedModelSource = deepseek-v4-pro, ADR-121) çalışır; tool
 * desteği yoksa SwitchableAgentChat Groq'a düşer (ADR-119). Watcher reasoner/verifier admin'de KALIR.
 */
import { type RunAgentInput, runAgent } from "../../application/agent/run-agent";
import type { AgentTool, ToolChat } from "../../domain/agent";
import type {
  AssistantMessage,
  AssistantReply,
  IntentAssistant,
} from "../../domain/intent-assistant";
import { extractJson } from "./openai-json";
import { AGENT_FEASIBILITY_SYSTEM, assistantLangRule } from "./prompts";
import { ReplySchema } from "./switchable";

/** Çok-turlu ajanın maliyet/gecikme sınırı — yalnız niyet adımında, üst-tur kesici (ADR-129). */
const MAX_ROUNDS = 4;
/** Ajana beslenen geçmiş penceresi — bağlam için yeterli, istem şişmesini önler. */
const HISTORY_WINDOW = 8;

/**
 * Sohbet geçmişini ajan için TEK user mesajına düzleştirir (runAgent tek system+user alır).
 * Son kullanıcı mesajı açıkça vurgulanır ki ajan "buna yanıt ver" hedefini şaşırmasın.
 */
function buildAgentUserPrompt(history: AssistantMessage[]): string {
  const recent = history.slice(-HISTORY_WINDOW);
  const transcript = recent
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  return [
    "Conversation so far:",
    transcript,
    "",
    `The user's LAST message (respond to THIS): ${lastUser?.content ?? ""}`,
  ].join("\n");
}

export class AgenticIntentAssistant implements IntentAssistant {
  constructor(
    private readonly toolChat: ToolChat,
    private readonly tools: AgentTool[],
    /** Ajan başarısız/parse-fail olursa düşülecek tek-atış asistanı (ADR-126). */
    private readonly fallback: IntentAssistant,
    private readonly maxRounds: number = MAX_ROUNDS,
  ) {}

  async chat(
    history: AssistantMessage[],
    lang?: string,
    userContext?: string,
  ): Promise<AssistantReply> {
    try {
      // ADR-113: kullanıcı kişiselleştirmesi sistem istemine eklenir (tek-atış ile aynı).
      const ctx = userContext?.trim()
        ? `\n\nUSER PERSONALIZATION (apply when relevant; never invent beyond it):\n${userContext.trim()}`
        : "";
      const input: RunAgentInput = {
        chat: this.toolChat,
        tools: this.tools,
        system: AGENT_FEASIBILITY_SYSTEM + assistantLangRule(lang) + ctx,
        user: buildAgentUserPrompt(history),
        maxRounds: this.maxRounds,
      };
      const { content } = await runAgent(input);
      return ReplySchema.parse(extractJson(content));
    } catch {
      // Ajan hata/parse-fail → tek-atış asistanı (kendi Groq fallback'iyle). O da düşerse route iner.
      return this.fallback.chat(history, lang, userContext);
    }
  }
}
