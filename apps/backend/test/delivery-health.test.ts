import { describe, expect, it } from "vitest";
import { deliveryHealth } from "../src/infrastructure/shared/delivery-health.util";

// ADR-142: teslimat sağlığı oranı — pending terminal değil; terminal yoksa null.
describe("deliveryHealth (ADR-142)", () => {
  it("hiç teslimat yok → successRate null, failed 0", () => {
    expect(deliveryHealth([])).toEqual({ successRate: null, failed: 0 });
  });

  it("hepsi başarılı (sent+delivered) → %100", () => {
    expect(deliveryHealth(["sent", "delivered", "sent"])).toEqual({ successRate: 100, failed: 0 });
  });

  it("3 başarı + 1 başarısız → %75, failed 1", () => {
    expect(deliveryHealth(["sent", "delivered", "sent", "failed"])).toEqual({
      successRate: 75,
      failed: 1,
    });
  });

  it("pending TERMINAL DEĞİL → orana katılmaz", () => {
    // 1 sent + 1 failed = terminal 2 → %50; 2 pending yok sayılır
    expect(deliveryHealth(["pending", "sent", "pending", "failed"])).toEqual({
      successRate: 50,
      failed: 1,
    });
  });

  it("hepsi pending → terminal yok → null", () => {
    expect(deliveryHealth(["pending", "pending"])).toEqual({ successRate: null, failed: 0 });
  });
});
