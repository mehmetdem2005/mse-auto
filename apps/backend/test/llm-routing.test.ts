import { describe, expect, it } from "vitest";
import { FixedModelSource } from "../src/infrastructure/llm/switchable";

// ADR-121: niyet asistanı/ajan SABİT modeli (deepseek-v4-pro) kullanır; watcher
// reasoner/verifier admin-seçili modelde kalır (ayrı LlmModelRouter ile beslenir).
describe("FixedModelSource (ADR-121 model ayrımı)", () => {
  it("sabit deepseek-v4-pro spec'ini döner (admin modelinden bağımsız)", async () => {
    const spec = await new FixedModelSource("deepseek/deepseek-v4-pro").activeSpec();
    expect(spec?.id).toBe("deepseek/deepseek-v4-pro");
    expect(spec?.provider).toBe("deepseek");
    expect(spec?.model).toBe("deepseek-v4-pro");
  });

  it("katalogda olmayan id → null (sağlayıcı/fallback zincirine bırakır)", async () => {
    expect(await new FixedModelSource("nope/nope").activeSpec()).toBeNull();
  });
});
