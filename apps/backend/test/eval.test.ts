import { describe, expect, it } from "vitest";
import type { CheckOutcome } from "../src/domain/checker";
import { type GoldenCase, judgeCase, summarize } from "../src/domain/eval";

function outcome(p: Partial<CheckOutcome>): CheckOutcome {
  return {
    detected: false,
    description: null,
    resultSummary: "x",
    reasoning: "r",
    confidence: 0.5,
    ...p,
  };
}

describe("eval judge (ADR-075/A4)", () => {
  it("tespit kararı doğru + anahtar kelime varsa GEÇER", () => {
    const g: GoldenCase = {
      id: "a",
      query: "q",
      expect: { detected: true, mustInclude: ["deprem"], confidenceAtLeast: 0.5 },
    };
    const s = judgeCase(
      g,
      outcome({ detected: true, description: "Büyük DEPREM oldu", confidence: 0.8 }),
    );
    expect(s.passed).toBe(true);
    expect(s.score).toBeCloseTo(1, 5);
  });

  it("tespit kararı yanlışsa KALIR (en kritik sinyal)", () => {
    const g: GoldenCase = { id: "b", query: "q", expect: { detected: true } };
    const s = judgeCase(g, outcome({ detected: false }));
    expect(s.passed).toBe(false);
    expect(s.detail.detectionMatch).toBe(false);
    expect(s.score).toBeLessThan(0.6);
  });

  it("doğru karar ama eksik anahtar kelime → KALIR", () => {
    const g: GoldenCase = {
      id: "c",
      query: "q",
      expect: { detected: true, mustInclude: ["sonuç"] },
    };
    const s = judgeCase(g, outcome({ detected: true, description: "başka bir şey" }));
    expect(s.passed).toBe(false);
    expect(s.detail.includeMatch).toBe(false);
  });

  it("güven bandı dışıysa KALIR", () => {
    const g: GoldenCase = {
      id: "d",
      query: "q",
      expect: { detected: false, confidenceAtMost: 0.4 },
    };
    const s = judgeCase(g, outcome({ detected: false, confidence: 0.9 }));
    expect(s.passed).toBe(false);
    expect(s.detail.confidenceOk).toBe(false);
  });

  it("özet: yanlış-pozitif ve yanlış-negatif doğru sayılır", () => {
    const goldens: GoldenCase[] = [
      { id: "fp", query: "q", expect: { detected: false } }, // beklenen yok
      { id: "fn", query: "q", expect: { detected: true } }, // beklenen var
      { id: "ok", query: "q", expect: { detected: true } },
    ];
    const scores = [
      judgeCase(goldens[0] as GoldenCase, outcome({ detected: true })), // yanlış-pozitif
      judgeCase(goldens[1] as GoldenCase, outcome({ detected: false })), // yanlış-negatif
      judgeCase(goldens[2] as GoldenCase, outcome({ detected: true })), // doğru
    ];
    const r = summarize(scores, goldens);
    expect(r.total).toBe(3);
    expect(r.falsePositives).toBe(1);
    expect(r.falseNegatives).toBe(1);
    expect(r.detectionAccuracy).toBeCloseTo(1 / 3, 5);
  });
});
