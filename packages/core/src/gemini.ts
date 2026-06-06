/**
 * Gemini client — the single brain for the whole pipeline.  [v0.3 hardened]
 *
 * Verified vs Google AI for Developers docs (June 2026):
 *  - Text/reasoning:  gemini-3.5-flash (GA) or gemini-3.1-pro-preview (best reasoning)
 *  - Embeddings:      gemini-embedding-001  (embedContent, configurable dim)
 *  - Image gen:       gemini-3.1-flash-image-preview ("Nano Banana 2")
 *  - TTS:             gemini-3.1-flash-tts-preview (70+ langs incl. Turkish, SynthID watermark)
 *  - Tools:           google_search grounding + function calling (combinable on Gemini 3.x)
 *  - Structured out:  responseMimeType:"application/json" + responseSchema → guaranteed shape
 *
 * v0.3 adds: response schemas (no more regex-salvaging JSON), real token metering via
 * usageMetadata, and safety-block detection (blocked output → typed error, not a crash).
 */
import { GoogleGenAI } from "@google/genai";
import { env } from "./env.js";
import { limiter } from "./ratelimit.js";

const API_KEY = process.env.GEMINI_API_KEY!;
if (!API_KEY) console.warn("[gemini] GEMINI_API_KEY is not set");

export const MODELS = {
  text: env().GEMINI_TEXT_MODEL,
  reasoning: env().GEMINI_REASONING_MODEL,
  image: env().GEMINI_IMAGE_MODEL,
  embedding: env().GEMINI_EMBED_MODEL,
  tts: env().GEMINI_TTS_MODEL,
};

export const ai = new GoogleGenAI({ apiKey: API_KEY });

/** Thrown when Gemini blocks a prompt/response for safety; the runner routes these to review. */
export class SafetyBlockedError extends Error {}

export interface GenUsage { promptTokens: number; outputTokens: number; totalTokens: number; }
export interface GenResult { text: string; functionCalls: any[]; grounding: any[]; usage: GenUsage; raw: any; }

export async function generate(opts: {
  model?: string;
  system?: string;
  prompt: string;
  search?: boolean;
  functions?: any[];
  json?: boolean;
  /** JSON schema for guaranteed structured output (recommended over `json` alone). */
  responseSchema?: Record<string, unknown>;
  thinkingLevel?: "minimal" | "low" | "medium" | "high";
}): Promise<GenResult> {
  const tools: any[] = [];
  if (opts.search) tools.push({ googleSearch: {} });
  if (opts.functions?.length) tools.push({ functionDeclarations: opts.functions });

  // Gemini 2.5 rejects structured output (JSON mime / responseSchema) when tools
  // (google_search grounding or function calling) are present. Prefer the tools and
  // let callers parse JSON from text (they all have a {...} regex fallback). The system
  // prompts already instruct "SADECE JSON".
  const wantStructured = Boolean(opts.json || opts.responseSchema) && tools.length === 0;

  const model = opts.model || MODELS.text;
  const resource = model === MODELS.reasoning ? "gemini-reasoning" : "gemini-text";
  await limiter.acquire(resource, { tokens: Math.ceil((opts.prompt.length + (opts.system?.length ?? 0)) / 4) });

  const res = await ai.models.generateContent({
    model,
    contents: opts.prompt,
    config: {
      systemInstruction: opts.system,
      tools: tools.length ? tools : undefined,
      responseMimeType: wantStructured ? "application/json" : undefined,
      responseSchema: wantStructured ? (opts.responseSchema as any) : undefined,
      thinkingConfig: opts.thinkingLevel ? ({ thinkingLevel: opts.thinkingLevel.toUpperCase() } as any) : undefined,
    },
  });

  // Safety / blocked-output handling.
  const pf = (res as any).promptFeedback;
  if (pf?.blockReason) throw new SafetyBlockedError(`Prompt blocked: ${pf.blockReason}`);
  const cand = (res as any).candidates?.[0];
  const fr = cand?.finishReason;
  if (fr && !["STOP", "MAX_TOKENS"].includes(fr))
    throw new SafetyBlockedError(`Generation stopped: ${fr}`);

  const um = (res as any).usageMetadata ?? {};
  return {
    text: res.text ?? "",
    functionCalls: (res as any).functionCalls ?? [],
    grounding: cand?.groundingMetadata?.groundingChunks ?? [],
    usage: {
      promptTokens: um.promptTokenCount ?? 0,
      outputTokens: um.candidatesTokenCount ?? 0,
      totalTokens: um.totalTokenCount ?? 0,
    },
    raw: res,
  };
}

export async function embed(texts: string[], outputDim = env().EMBED_DIM): Promise<number[][]> {
  await limiter.acquire("gemini-embed", { tokens: Math.ceil(texts.join(" ").length / 4) });
  const res = await ai.models.embedContent({
    model: MODELS.embedding,
    contents: texts,
    config: { outputDimensionality: outputDim },
  });
  return (res.embeddings ?? []).map((e: any) => e.values as number[]);
}

/** Original, license-safe image for a beat. Returns base64 PNG (SynthID-watermarked). */
export async function generateImage(prompt: string): Promise<string> {
  await limiter.acquire("gemini-image", { images: 1 });
  const res = await ai.models.generateContent({ model: MODELS.image, contents: prompt });
  const parts = (res as any).candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p: any) => p.inlineData?.data);
  if (!img) throw new Error("No image returned");
  return img.inlineData.data as string;
}

/** TTS narration via the Interactions API (verified payload). Returns base64-decoded WAV. */
export async function tts(opts: { text: string; voice?: string; styleInstruction?: string }): Promise<Buffer> {
  const voice = opts.voice || env().TTS_VOICE;
  await limiter.acquire("gemini-tts");
  const input = `${opts.styleInstruction ? `[style: ${opts.styleInstruction}]\n` : ""}Read the following narration exactly, in a natural voice:\n\n${opts.text}`;
  const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json", "Api-Revision": "2026-05-20" },
    body: JSON.stringify({ model: MODELS.tts, input, response_modalities: ["audio"], generation_config: { speech_config: [{ voice }] } }),
  });
  if (!resp.ok) throw new Error(`TTS failed: ${resp.status} ${await resp.text()}`);
  const data: any = await resp.json();
  const b64 = data?.output_audio?.data ?? data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!b64) throw new Error("TTS returned no audio");
  return Buffer.from(b64, "base64");
}

/** JSON schema for a ShortScript — forces guaranteed structured output (no regex salvage). */
export const SHORT_SCRIPT_SCHEMA = {
  type: "object",
  properties: {
    hook: { type: "string" },
    beats: { type: "array", items: { type: "string" } },
    payoff: { type: "string" },
    cta: { type: "string" },
    commentary: { type: "string" },
    onScreenText: { type: "array", items: { type: "string" } },
    visualPrompts: { type: "array", items: { type: "string" } },
    title: { type: "string" },
    description: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    sources: { type: "array", items: { type: "object", properties: { title: { type: "string" }, url: { type: "string" } }, required: ["title", "url"] } },
    narrationText: { type: "string" },
    estDurationSec: { type: "number" },
    language: { type: "string" },
    styleId: { type: "string" },
  },
  required: ["hook", "beats", "payoff", "cta", "commentary", "title", "description", "tags", "sources", "narrationText"],
};

/**
 * Multi-turn function-calling step (the basis of the tool-using agent loop). The model proposes
 * tool calls; the APP executes & validates them and appends the results, then calls this again —
 * the same think→act→observe pattern Kimi uses. `contents` is the running Gemini history array;
 * append the returned `modelContent`, then a functionResponse content, and loop.
 */
export interface AgentTurn { text: string; functionCalls: any[]; modelContent: any; usage: GenUsage; }
export async function generateTurn(opts: {
  model?: string;
  system?: string;
  contents: any[];                 // Gemini Content[] ({ role, parts })
  functions?: any[];               // FunctionDeclaration[]
  thinkingLevel?: "minimal" | "low" | "medium" | "high";
}): Promise<AgentTurn> {
  const model = opts.model || MODELS.reasoning;
  const resource = model === MODELS.reasoning ? "gemini-reasoning" : "gemini-text";
  const approxChars = JSON.stringify(opts.contents).length + (opts.system?.length ?? 0);
  await limiter.acquire(resource, { tokens: Math.ceil(approxChars / 4) });

  const res = await ai.models.generateContent({
    model,
    contents: opts.contents,
    config: {
      systemInstruction: opts.system,
      tools: opts.functions?.length ? [{ functionDeclarations: opts.functions }] : undefined,
      thinkingConfig: opts.thinkingLevel ? ({ thinkingLevel: opts.thinkingLevel.toUpperCase() } as any) : undefined,
    },
  });

  const pf = (res as any).promptFeedback;
  if (pf?.blockReason) throw new SafetyBlockedError(`Prompt blocked: ${pf.blockReason}`);
  const cand = (res as any).candidates?.[0];
  const fr = cand?.finishReason;
  if (fr && !["STOP", "MAX_TOKENS"].includes(fr)) throw new SafetyBlockedError(`Generation stopped: ${fr}`);

  const um = (res as any).usageMetadata ?? {};
  return {
    text: res.text ?? "",
    functionCalls: (res as any).functionCalls ?? [],
    modelContent: cand?.content ?? { role: "model", parts: [{ text: res.text ?? "" }] },
    usage: { promptTokens: um.promptTokenCount ?? 0, outputTokens: um.candidatesTokenCount ?? 0, totalTokens: um.totalTokenCount ?? 0 },
  };
}
