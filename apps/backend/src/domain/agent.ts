/**
 * Ajan / function-calling portları (ADR-122). Domain SAF: araç tanımı + araç çağrısı +
 * sağlayıcı-bağımsız "araçlarla sohbet" portu + ajanın çalıştırabileceği araç. Infra (switchable/
 * openai-json) ToolChat'i implement eder; application (run-agent) döngüyü kurar.
 */

/** Modele sunulan araç tanımı (OpenAI function-calling şeması). */
export interface ToolDef {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

/** Modelin istediği araç çağrısı (sadeleştirilmiş). */
export interface ToolCall {
  id: string;
  name: string;
  /** JSON string — araç parametreleri. */
  arguments: string;
}

/** Araç-çağırma sohbet mesajı — system/user/assistant(+tool_calls)/tool rolleri. */
export type ToolChatMessage =
  | { role: "system" | "user"; content: string }
  | {
      role: "assistant";
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: "function";
        function: { name: string; arguments: string };
      }>;
    }
  | { role: "tool"; tool_call_id: string; content: string };

/** Araçlarla tek sohbet turu — sağlayıcı-bağımsız port (infra implement eder). */
export interface ToolChat {
  chat(
    messages: ToolChatMessage[],
    tools: ToolDef[],
  ): Promise<{ content: string | null; toolCalls: ToolCall[] }>;
}

/** Ajanın çağırabileceği araç — adı/şeması modele, `run` infra'yı sarmalar, sonuç metni modele beslenir. */
export interface AgentTool {
  name: string;
  description: string;
  /** OpenAI function-calling parametre şeması (JSON schema). */
  parameters: Record<string, unknown>;
  run(args: Record<string, unknown>): Promise<string>;
}
