import { describe, expect, it } from "vitest";
import type { AssistantMessage } from "../src/domain/intent-assistant";
import { HeuristicIntentAssistant } from "../src/infrastructure/assistant/heuristic.assistant";

// ADR-130: LLM yokken (sezgisel mod) "ne yapabilirsin / örnek ver / N madde" gibi KAPASİTE isteği
// artık yardımcı örnek-listesiyle yanıtlanır — junk niyet (ready=true) ÜRETİLMEZ, soru gerçekten cevaplanır.
const assistant = new HeuristicIntentAssistant();
const u = (content: string): AssistantMessage[] => [{ role: "user", content }];

describe("HeuristicIntentAssistant — kapasite/örnek isteği (ADR-130)", () => {
  it("ekran-görüntüsü vakası: '20 maddede seni kullanabileceğim şeylerden bahset' → ready=false, örnekli yanıt, junk YOK", async () => {
    const r = await assistant.chat(
      u("Hayır 20 maddede seni kullanabileceğim şeylerden bahset"),
      "tr",
    );
    expect(r.ready).toBe(false);
    expect(r.intent).toBeNull();
    // yardımcı liste döner (en az birkaç numaralı örnek)
    expect(r.message).toMatch(/1\./);
    expect(r.message.toLowerCase()).toContain("fiyat");
  });

  it("'neler yapabilirsin' → ready=false + örnekli yanıt", async () => {
    const r = await assistant.chat(u("neler yapabilirsin"), "tr");
    expect(r.ready).toBe(false);
    expect(r.intent).toBeNull();
    expect(r.message).toMatch(/\d\./);
  });

  it("EN 'what can you do' → ready=false + örnekli yanıt (İngilizce)", async () => {
    const r = await assistant.chat(u("what can you do for me?"), "en");
    expect(r.ready).toBe(false);
    expect(r.intent).toBeNull();
    expect(r.message.toLowerCase()).toContain("price");
  });

  it("REGRESYON: gerçek spesifik niyet hâlâ ready=true (kapasite sanılmaz)", async () => {
    const r = await assistant.chat(u("iPhone 15 fiyatı 50000 altına inince haber ver"), "tr");
    expect(r.ready).toBe(true);
    expect(r.intent).toContain("iPhone");
  });

  it("REGRESYON: saçma girdi hâlâ reddedilir (ready=false, junk yok)", async () => {
    const r = await assistant.chat(u("asdf asdf asdf"), "tr");
    expect(r.ready).toBe(false);
    expect(r.intent).toBeNull();
  });
});
