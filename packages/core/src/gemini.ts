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

// ── Text LLM backend (OpenAI-compatible: DeepSeek / Groq) ───────────────────
// Gemini's free tier is brutal (20 req/DAY). We route text generation to a chat provider.
// DeepSeek v4-pro (dynamic-concurrency, reasoning_content) is preferred; Groq is the fallback.
// Embeddings via OpenAI, image/TTS stay on Gemini.
const GROQ_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-pro";
const PROVIDER = process.env.LLM_PROVIDER || (DEEPSEEK_KEY ? "deepseek" : GROQ_KEY ? "groq" : "gemini");
const CHAT = PROVIDER === "deepseek" && DEEPSEEK_KEY
  ? { url: "https://api.deepseek.com/chat/completions", key: DEEPSEEK_KEY, model: DEEPSEEK_MODEL, name: "DeepSeek" }
  : PROVIDER === "groq" && GROQ_KEY
  ? { url: "https://api.groq.com/openai/v1/chat/completions", key: GROQ_KEY, model: GROQ_MODEL, name: "Groq" }
  : null;
const USE_CHAT = !!CHAT;

// Embeddings via OpenAI (only embeddings) — text-embedding-3-small supports a `dimensions`
// param so we get 768-dim vectors that match the pgvector(768) schema. Avoids Gemini's
// tiny embedding free-tier quota. Used when OPENAI_API_KEY is set.
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";
async function openaiEmbed(texts: string[], dim: number): Promise<number[][]> {
  const resp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: OPENAI_EMBED_MODEL, input: texts, dimensions: dim }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    const err: any = new Error(`OpenAI embed ${resp.status}: ${body.slice(0, 200)}`);
    err.status = resp.status;
    throw err;
  }
  const d: any = await resp.json();
  return (d.data ?? []).sort((a: any, b: any) => a.index - b.index).map((x: any) => x.embedding as number[]);
}

async function chatGenerate(opts: { model?: string; system?: string; prompt: string; json?: boolean; responseSchema?: Record<string, unknown>; }): Promise<GenResult> {
  const wantJson = Boolean(opts.json || opts.responseSchema);
  const resource = opts.model === MODELS.reasoning ? "gemini-reasoning" : "gemini-text";
  await limiter.acquire(resource, { tokens: Math.ceil((opts.prompt.length + (opts.system?.length ?? 0)) / 4) });
  const messages: any[] = [];
  if (opts.system) messages.push({ role: "system", content: opts.system + (wantJson ? "\n\nYANIT SADECE tek ve geçerli bir JSON nesnesi olmalı; başka metin yazma." : "") });
  messages.push({ role: "user", content: opts.prompt });
  const resp = await fetch(CHAT!.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${CHAT!.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: CHAT!.model, messages, temperature: 0.7, max_tokens: 4096, ...(wantJson ? { response_format: { type: "json_object" } } : {}) }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    const err: any = new Error(`${CHAT!.name} ${resp.status}: ${body.slice(0, 300)}`);
    err.status = resp.status;                                  // so reliability.isRateLimit() detects 429 → backoff
    const ra = resp.headers.get("retry-after"); if (ra) err.retryAfter = ra;
    throw err;
  }
  const d: any = await resp.json();
  const text = d.choices?.[0]?.message?.content ?? "";
  const u = d.usage ?? {};
  return {
    text, functionCalls: [], grounding: [],
    usage: { promptTokens: u.prompt_tokens ?? 0, outputTokens: u.completion_tokens ?? 0, totalTokens: u.total_tokens ?? Math.ceil(text.length / 4) },
    raw: d,
  };
}

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
  if (USE_CHAT) return chatGenerate(opts);   // route text generation to DeepSeek/Groq
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
      thinkingConfig: (opts.thinkingLevel && process.env.GEMINI_THINKING === "on") ? ({ thinkingLevel: opts.thinkingLevel.toUpperCase() } as any) : undefined,
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
  try {
    if (OPENAI_KEY) return await openaiEmbed(texts, outputDim);
    const res = await ai.models.embedContent({
      model: MODELS.embedding,
      contents: texts,
      config: { outputDimensionality: outputDim },
    });
    return (res.embeddings ?? []).map((e: any) => e.values as number[]);
  } catch (e) {
    // Runtime resilience: Gemini embeddings have their own (small) free-tier quota. When EMBED_FALLBACK
    // is on, degrade to zero-vectors so a Groq-generated draft still completes instead of dead-lettering.
    // (Seeding runs WITHOUT this flag so it fails loudly and stores only real vectors.)
    if (process.env.EMBED_FALLBACK === "on") {
      console.warn("[gemini] embed failed — zero-vector fallback:", String((e as any)?.message || e).slice(0, 120));
      return texts.map(() => new Array(outputDim).fill(0));
    }
    throw e;
  }
}

/** Original, license-safe image for a beat. Returns base64 PNG.
 *  Prefers OpenAI gpt-image-1 — Gemini's free tier can't generate images, so every render fell
 *  back to flat gradients (imageless videos). Falls back to Gemini, then the caller's gradient. */
async function openaiImage(prompt: string): Promise<string> {
  const r = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt: prompt.slice(0, 900),
      size: process.env.OPENAI_IMAGE_SIZE || "1024x1536", // portrait → ffmpeg crops to 9:16
      n: 1,
    }),
  });
  if (!r.ok) throw new Error(`OpenAI image ${r.status}: ${(await r.text()).slice(0, 160)}`);
  const d: any = await r.json();
  const b64 = d.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI: no image data");
  return b64 as string;
}

export async function generateImage(prompt: string): Promise<string> {
  if (OPENAI_KEY) {
    try { return await openaiImage(prompt); }
    catch (e) { console.warn("[image] OpenAI failed, Gemini fallback:", String((e as any)?.message || e).slice(0, 140)); }
  }
  await limiter.acquire("gemini-image", { images: 1 });
  const res = await ai.models.generateContent({ model: MODELS.image, contents: prompt });
  const parts = (res as any).candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p: any) => p.inlineData?.data);
  if (!img) throw new Error("No image returned");
  return img.inlineData.data as string;
}

/** Premium narration via OpenAI TTS (tts-1-hd) — avoids the robotic Google voice. Returns MP3. */
async function openaiTTS(text: string): Promise<Buffer> {
  const r = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.OPENAI_TTS_MODEL || "tts-1-hd", voice: process.env.NARRATION_VOICE || "onyx", input: text.slice(0, 4000), response_format: "mp3" }),
  });
  if (!r.ok) throw new Error(`OpenAI TTS ${r.status}: ${(await r.text()).slice(0, 160)}`);
  return Buffer.from(await r.arrayBuffer());
}

/** TTS narration. Prefers OpenAI premium voice when configured; falls back to Gemini. */
export async function tts(opts: { text: string; voice?: string; styleInstruction?: string }): Promise<Buffer> {
  if (OPENAI_KEY) { try { return await openaiTTS(opts.text); } catch (e) { console.warn("[tts] OpenAI failed, Gemini fallback:", String((e as any)?.message || e).slice(0, 100)); } }
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
      thinkingConfig: (opts.thinkingLevel && process.env.GEMINI_THINKING === "on") ? ({ thinkingLevel: opts.thinkingLevel.toUpperCase() } as any) : undefined,
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
