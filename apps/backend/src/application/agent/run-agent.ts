/**
 * Ajan döngüsü (ADR-122): model araç ister → aracı çalıştır → sonucu modele besle → tekrar.
 * Model araç istemezse (ya da tur sınırı dolunca) düz yanıt döner. Sağlayıcı-bağımsız (ToolChat portu).
 */
import type { AgentTool, ToolChat, ToolChatMessage, ToolDef } from "../../domain/agent";

export interface RunAgentInput {
  chat: ToolChat;
  tools: AgentTool[];
  system: string;
  user: string;
  /** Üst tur sınırı (sonsuz araç döngüsünü keser). */
  maxRounds?: number;
}

export interface RunAgentResult {
  content: string;
  rounds: number;
  toolsUsed: string[];
}

const DEFAULT_MAX_ROUNDS = 4;

export async function runAgent(input: RunAgentInput): Promise<RunAgentResult> {
  const maxRounds = input.maxRounds ?? DEFAULT_MAX_ROUNDS;
  const toolDefs: ToolDef[] = input.tools.map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
  const byName = new Map(input.tools.map((t) => [t.name, t]));
  const messages: ToolChatMessage[] = [
    { role: "system", content: input.system },
    { role: "user", content: input.user },
  ];
  const toolsUsed: string[] = [];

  for (let round = 0; round < maxRounds; round++) {
    const { content, toolCalls } = await input.chat.chat(messages, toolDefs);
    if (toolCalls.length === 0) return { content: content ?? "", rounds: round + 1, toolsUsed };

    // Modelin araç-isteği mesajını geçmişe ekle (sonraki turda bağlam).
    messages.push({
      role: "assistant",
      content: content ?? "",
      tool_calls: toolCalls.map((tc) => ({
        id: tc.id,
        type: "function",
        function: { name: tc.name, arguments: tc.arguments },
      })),
    });
    // Her aracı çalıştır → sonucu `tool` rolüyle besle (hata olsa bile döngü çökmesin).
    for (const tc of toolCalls) {
      const tool = byName.get(tc.name);
      let result: string;
      try {
        const args = tc.arguments ? (JSON.parse(tc.arguments) as Record<string, unknown>) : {};
        result = tool ? await tool.run(args) : `Bilinmeyen araç: ${tc.name}`;
      } catch (err) {
        result = `Araç hatası (${tc.name}): ${err instanceof Error ? err.message : String(err)}`;
      }
      toolsUsed.push(tc.name);
      messages.push({ role: "tool", tool_call_id: tc.id, content: result });
    }
  }

  // Tur sınırı doldu → araçsız son tur ile kesin yanıt zorla.
  const final = await input.chat.chat(messages, []);
  return { content: final.content ?? "", rounds: maxRounds, toolsUsed };
}
