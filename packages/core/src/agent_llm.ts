/** Gemini-backed LLM turn for the agent runtime (separate module to keep imports clean). */
import { generateTurn, MODELS } from "./gemini.js";
import { recordUsage } from "./budget.js";
import type { LlmTurnFn } from "./runtime.js";

export const gemTurn: LlmTurnFn = async (a) => {
  const t = await generateTurn({ ...a, model: MODELS.reasoning, thinkingLevel: "medium" });
  await recordUsage("reasoning", t.usage.totalTokens || 1);
  return t;
};
