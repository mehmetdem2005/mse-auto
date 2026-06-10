import type { AssistChatInput, AssistReply } from "@watcher/contracts";
import type { IntentAssistant } from "../domain/intent-assistant";

export interface AssistIntentDeps {
  assistant: IntentAssistant;
}

/** Sohbet geçmişini asistana iletir; netleştirme sorusu veya hazır niyet döner. */
export async function assistIntent(
  deps: AssistIntentDeps,
  input: AssistChatInput,
): Promise<AssistReply> {
  const reply = await deps.assistant.chat(input.messages);
  // ready ise intent boş olamaz; tutarsızlığı normalize et.
  if (reply.ready && (!reply.intent || reply.intent.trim().length < 3)) {
    return { ...reply, ready: false, intent: null };
  }
  return reply;
}
