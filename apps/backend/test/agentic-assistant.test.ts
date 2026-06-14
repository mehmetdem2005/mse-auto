import { assistReplySchema } from "@watcher/contracts";
import { describe, expect, it } from "vitest";
import type { AgentTool, ToolChat } from "../src/domain/agent";
import type { AssistantReply, IntentAssistant } from "../src/domain/intent-assistant";
import { AgenticIntentAssistant } from "../src/infrastructure/llm/agentic-assistant";

// ADR-129: olay-bazlı fizibilite ajanı — araçlarla GERÇEKTEN araştırır, yapısal can/partial/cannot
// kararı döner; hata/parse-fail'de tek-atış asistanına (fallback) düşer. Sihirbaz hiç tıkanmaz.

const searchTool: AgentTool = {
  name: "web_search",
  description: "ara",
  parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  run: async (args) => `sonuç(${String(args.query)})`,
};

const FALLBACK_REPLY: AssistantReply = {
  ready: false,
  message: "fallback-yaniti",
  intent: null,
  frequencyMinutes: null,
  confidence: 0,
};

/** Fallback'in çağrılıp çağrılmadığını izleyen işaretli sahte asistan. */
class MarkerAssistant implements IntentAssistant {
  called = false;
  async chat(): Promise<AssistantReply> {
    this.called = true;
    return FALLBACK_REPLY;
  }
}

describe("AgenticIntentAssistant (ADR-129 fizibilite ajanı)", () => {
  it("araç çağırır → araştırır → yapısal can/partial/cannot kararı + adımlar + site-izni döner", async () => {
    let round = 0;
    const seenToolResult: string[] = [];
    const chat: ToolChat = {
      async chat(messages) {
        round++;
        if (round === 1) {
          return {
            content: null,
            toolCalls: [{ id: "c1", name: "web_search", arguments: '{"query":"sınav"}' }],
          };
        }
        const toolMsg = messages.find((m) => m.role === "tool");
        if (toolMsg && "content" in toolMsg) seenToolResult.push(toolMsg.content);
        const verdict = {
          ready: true,
          message: "Sınav giriş belgesi duyurusunu izleyeceğim.",
          intent: "sınav giriş belgesi açıklandığında haber ver",
          frequencyMinutes: 120,
          confidence: 0.9,
          searchQuery: "sınav giriş belgesi",
          searchMethods: ["web araması", "resmî site"],
          feasibility: "Kamusal duyuruyla izlenebilir.",
          feasibilityVerdict: "can",
          plannedSteps: ["resmî siteyi izle", "duyuru çıkınca haber ver"],
          sitePermission: { allowed: true, note: "robots tam engellemiyor (advisory)." },
        };
        return { content: JSON.stringify(verdict), toolCalls: [] };
      },
    };
    const fallback = new MarkerAssistant();
    const assistant = new AgenticIntentAssistant(chat, [searchTool], fallback);
    const reply = await assistant.chat([{ role: "user", content: "sınav giriş belgesi" }], "tr");

    expect(reply.ready).toBe(true);
    expect(reply.feasibilityVerdict).toBe("can");
    expect(reply.plannedSteps).toEqual(["resmî siteyi izle", "duyuru çıkınca haber ver"]);
    expect(reply.sitePermission).toEqual({
      allowed: true,
      note: "robots tam engellemiyor (advisory).",
    });
    expect(fallback.called).toBe(false);
    expect(round).toBe(2); // araç turu + final tur
    expect(seenToolResult).toEqual(["sonuç(sınav)"]); // gerçek araç sonucu modele beslendi
  });

  it("selamlama: araç çağırmadan ready=false JSON döner (Rule #2 korunur)", async () => {
    const chat: ToolChat = {
      async chat() {
        return {
          content: JSON.stringify({
            ready: false,
            message: "Merhaba! Neyden haberdar olmak istersin?",
            intent: null,
            frequencyMinutes: null,
            confidence: 0,
            feasibilityVerdict: null,
            plannedSteps: [],
            sitePermission: null,
          }),
          toolCalls: [],
        };
      },
    };
    const fallback = new MarkerAssistant();
    const reply = await new AgenticIntentAssistant(chat, [searchTool], fallback).chat(
      [{ role: "user", content: "merhaba" }],
      "tr",
    );
    expect(reply.ready).toBe(false);
    expect(reply.feasibilityVerdict).toBeNull();
    expect(fallback.called).toBe(false);
  });

  it("ajan parse-edilemez içerik döndürürse tek-atış asistanına düşer", async () => {
    const chat: ToolChat = {
      async chat() {
        return { content: "bu JSON değil, düz metin", toolCalls: [] };
      },
    };
    const fallback = new MarkerAssistant();
    const reply = await new AgenticIntentAssistant(chat, [searchTool], fallback).chat([
      { role: "user", content: "x" },
    ]);
    expect(fallback.called).toBe(true);
    expect(reply.message).toBe("fallback-yaniti");
  });

  it("ajan/ToolChat hata fırlatırsa tek-atış asistanına düşer (sihirbaz tıkanmaz)", async () => {
    const chat: ToolChat = {
      async chat() {
        throw new Error("LLM down");
      },
    };
    const fallback = new MarkerAssistant();
    const reply = await new AgenticIntentAssistant(chat, [searchTool], fallback).chat([
      { role: "user", content: "deprem olunca haber ver" },
    ]);
    expect(fallback.called).toBe(true);
    expect(reply.message).toBe("fallback-yaniti");
  });
});

describe("assistReplySchema — fizibilite alanları geri-uyumlu (ADR-129)", () => {
  it("yeni alanlar (feasibilityVerdict/plannedSteps/sitePermission) kabul edilir", () => {
    const parsed = assistReplySchema.parse({
      ready: true,
      message: "izleyeceğim",
      intent: "haber ver",
      frequencyMinutes: 120,
      confidence: 0.8,
      feasibilityVerdict: "partial",
      plannedSteps: ["adım 1", "adım 2"],
      sitePermission: { allowed: false, note: "portal login istiyor" },
    });
    expect(parsed.feasibilityVerdict).toBe("partial");
    expect(parsed.sitePermission?.allowed).toBe(false);
  });

  it("yeni alanlar OPSİYONEL — eski (alan-suz) yanıt hâlâ geçerli (geri-uyum)", () => {
    const parsed = assistReplySchema.parse({
      ready: false,
      message: "hangi şehir?",
      intent: null,
      frequencyMinutes: null,
      confidence: 0,
    });
    expect(parsed.feasibilityVerdict).toBeUndefined();
    expect(parsed.plannedSteps).toBeUndefined();
  });

  it("feasibilityVerdict yalnız can/partial/cannot kabul eder", () => {
    expect(() =>
      assistReplySchema.parse({
        ready: true,
        message: "x",
        intent: "y",
        frequencyMinutes: 60,
        confidence: 0.5,
        feasibilityVerdict: "maybe",
      }),
    ).toThrow();
  });
});
