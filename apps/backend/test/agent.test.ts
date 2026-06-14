import { describe, expect, it } from "vitest";
import { runAgent } from "../src/application/agent/run-agent";
import { webSearchTool } from "../src/application/agent/tools";
import type { AgentTool, ToolChat } from "../src/domain/agent";
import { openaiToolChat } from "../src/infrastructure/llm/openai-json";

describe("runAgent — ajan döngüsü (ADR-122)", () => {
  const searchTool: AgentTool = {
    name: "web_search",
    description: "ara",
    parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
    run: async (args) => `sonuç(${String(args.query)})`,
  };

  it("araç ister → çalışır → sonuç beslenir → düz yanıt döner", async () => {
    let round = 0;
    const chat: ToolChat = {
      async chat(messages) {
        round++;
        if (round === 1) {
          return {
            content: null,
            toolCalls: [{ id: "c1", name: "web_search", arguments: '{"query":"x"}' }],
          };
        }
        const toolMsg = messages.find((m) => m.role === "tool");
        return {
          content: `gördüm:${toolMsg && "content" in toolMsg ? toolMsg.content : ""}`,
          toolCalls: [],
        };
      },
    };
    const r = await runAgent({ chat, tools: [searchTool], system: "s", user: "u" });
    expect(r.toolsUsed).toEqual(["web_search"]);
    expect(r.content).toBe("gördüm:sonuç(x)");
    expect(r.rounds).toBe(2);
  });

  it("araç istemez → tek tur, düz yanıt", async () => {
    const chat: ToolChat = {
      async chat() {
        return { content: "merhaba", toolCalls: [] };
      },
    };
    const r = await runAgent({ chat, tools: [], system: "s", user: "u" });
    expect(r.content).toBe("merhaba");
    expect(r.rounds).toBe(1);
    expect(r.toolsUsed).toEqual([]);
  });

  it("bilinmeyen araç → hata mesajı beslenir, çökmez", async () => {
    let round = 0;
    const chat: ToolChat = {
      async chat() {
        round++;
        return round === 1
          ? { content: null, toolCalls: [{ id: "z", name: "nope", arguments: "{}" }] }
          : { content: "ok", toolCalls: [] };
      },
    };
    const r = await runAgent({ chat, tools: [], system: "s", user: "u" });
    expect(r.content).toBe("ok");
    expect(r.toolsUsed).toEqual(["nope"]);
  });

  it("tur sınırı dolunca araçsız son tur ile kesin yanıt zorlanır", async () => {
    const chat: ToolChat = {
      async chat(_messages, tools) {
        // tools boşsa (son tur) düz yanıt; doluysa hep araç iste (sonsuz istek senaryosu)
        return tools.length === 0
          ? { content: "final", toolCalls: [] }
          : { content: null, toolCalls: [{ id: "c", name: "web_search", arguments: "{}" }] };
      },
    };
    const r = await runAgent({ chat, tools: [searchTool], system: "s", user: "u", maxRounds: 2 });
    expect(r.content).toBe("final");
    expect(r.rounds).toBe(2);
  });
});

describe("webSearchTool", () => {
  it("sonuçları numaralı satıra biçimler; boşsa 'bulunamadı'", async () => {
    const tool = webSearchTool(async (q) =>
      q === "var" ? [{ title: "Başlık", snippet: "özet", date: "2026-06-14" }] : [],
    );
    expect(await tool.run({ query: "var" })).toContain("1. Başlık — özet (2026-06-14)");
    expect(await tool.run({ query: "yok" })).toBe("Sonuç bulunamadı.");
    expect(await tool.run({ query: "" })).toBe("Boş sorgu.");
  });
});

describe("openaiToolChat — wire format ayrıştırma (ADR-122)", () => {
  it("yanıttaki tool_calls'ı sadeleştirilmiş ToolCall'a çevirir", async () => {
    const fakeFetch = (async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: null,
                tool_calls: [
                  {
                    id: "call_1",
                    type: "function",
                    function: { name: "web_search", arguments: '{"query":"abc"}' },
                  },
                ],
              },
            },
          ],
          usage: { total_tokens: 42 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )) as unknown as typeof fetch;
    const r = await openaiToolChat({
      baseUrl: "https://api.deepseek.com",
      apiKey: "k",
      model: "deepseek-v4-pro",
      messages: [{ role: "user", content: "abc ara" }],
      tools: [
        { type: "function", function: { name: "web_search", description: "ara", parameters: {} } },
      ],
      temperature: 0,
      maxTokens: 256,
      fetchImpl: fakeFetch,
    });
    expect(r.toolCalls).toEqual([
      { id: "call_1", name: "web_search", arguments: '{"query":"abc"}' },
    ]);
    expect(r.content).toBeNull();
    expect(r.tokensUsed).toBe(42);
  });
});
