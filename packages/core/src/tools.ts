/**
 * The SAFE tool set sub-agents can use. Deliberately limited (no code exec, no fs, no arbitrary
 * fetch): RAG retrieval, grounded web research, memory, and a shared blackboard for coordination.
 */
import type { Tool } from "./runtime.js";
import { retrieve } from "./rag.js";
import { recall, remember } from "./memory.js";
import { generate } from "./gemini.js";
import { recordUsage } from "./budget.js";

export function defaultTools(): Tool[] {
  return [
    {
      name: "rag_search",
      description: "Doğrulanmış bilgi tabanında (RAG) ara. Olayların gerçek kaynaklı detayları için kullan.",
      parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
      run: async ({ query }) => {
        const c = await retrieve(String(query), 6);
        return { results: c.map((x: any) => ({ topic: x.topic, text: String(x.text).slice(0, 500), source: x.source_url })) };
      },
    },
    {
      name: "web_research",
      description: "Web aramasıyla kısa, KAYNAKLI ve doğrulanabilir bilgi topla. Yalnızca olgu doğrulamak için.",
      parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
      run: async ({ query }) => {
        const r = await generate({ prompt: `Şu konuda kısa, kaynaklı, doğrulanabilir olgular ver: ${query}`, search: true });
        await recordUsage("text", r.usage.totalTokens || 1);
        return { findings: r.text.slice(0, 1500), citations: (r.grounding ?? []).slice(0, 5) };
      },
    },
    {
      name: "recall",
      description: "Geçmiş tercih/içgörüleri hatırla (semantik bellek).",
      parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
      run: async ({ query }) => ({ memories: (await recall(String(query), 6)).map((m: any) => m.content) }),
    },
    {
      name: "remember",
      description: "Önemli bir içgörü/karar kaydet (gelecekte hatırlanır).",
      parameters: { type: "object", properties: { kind: { type: "string" }, value: { type: "string" } }, required: ["value"] },
      run: async ({ kind, value }) => { const allowed = ["preference", "fact", "performance_insight", "used_topic", "strategy_note"]; await remember((allowed.includes(String(kind)) ? String(kind) : "fact") as any, String(value)); return { ok: true }; },
    },
    {
      name: "write_artifact",
      description: "Ara çıktıyı paylaşılan panoya yaz (diğer ajanlar okuyabilir).",
      parameters: { type: "object", properties: { key: { type: "string" }, value: {} }, required: ["key", "value"] },
      run: async ({ key, value }, ctx) => { ctx.blackboard.set(String(key), value); return { ok: true }; },
    },
    {
      name: "read_artifact",
      description: "Paylaşılan panodan bir ara çıktıyı oku.",
      parameters: { type: "object", properties: { key: { type: "string" } }, required: ["key"] },
      run: async ({ key }, ctx) => ({ value: ctx.blackboard.get(String(key)) ?? null }),
    },
    {
      name: "finish",
      description: "Alt görevi tamamla ve sonucu döndür.",
      parameters: { type: "object", properties: { result: {} }, required: ["result"] },
      run: async ({ result }) => ({ result }),
    },
  ];
}

/**
 * MCP-aligned export. Research (2026): MCP (Model Context Protocol) is the open standard for tool
 * exposure (Linux Foundation; supported by OpenAI Agents SDK, Google ADK, Claude Agent SDK, etc.).
 * This maps our safe tools to MCP tool definitions so they can be served/consumed via an MCP server
 * with no behavior change. (A thin MCP server wrapper is the only remaining glue — see AGENTS.md.)
 */
export function toMcpToolDefs() {
  return defaultTools().map((t) => ({ name: t.name, description: t.description, inputSchema: t.parameters }));
}
