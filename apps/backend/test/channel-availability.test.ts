import { describe, expect, it } from "vitest";
import { configuredAvailability, effectiveAvailability } from "../src/application/channel-config";

// ADR-152: kanal kullanılabilirliği = admin AÇTI **ve** sunucuda kimlik bilgisi var (sessiz başarısızlık yok).
describe("kanal kullanılabilirliği — configured + effective (ADR-152)", () => {
  it("configuredAvailability: yalnız sender üretilmiş (kimlik bilgili) kanallar true", () => {
    expect(configuredAvailability(["telegram"])).toEqual({
      telegram: true,
      whatsapp: false,
      email: false,
    });
    expect(configuredAvailability(["telegram", "email", "whatsapp"])).toEqual({
      telegram: true,
      whatsapp: true,
      email: true,
    });
    expect(configuredAvailability([])).toEqual({
      telegram: false,
      whatsapp: false,
      email: false,
    });
  });

  it("effectiveAvailability = admin AÇTI ve sunucuda kimlik bilgisi var (AND)", () => {
    const admin = { telegram: true, whatsapp: true, email: true };
    const configured = { telegram: true, whatsapp: false, email: true };
    // whatsapp: admin açık ama sunucuda kimlik bilgisi yok → etkin DEĞİL (dürüst).
    expect(effectiveAvailability(admin, configured)).toEqual({
      telegram: true,
      whatsapp: false,
      email: true,
    });
  });

  it("admin kapatınca kimlik bilgisi olsa da etkin false", () => {
    const admin = { telegram: false, whatsapp: true, email: true };
    const configured = { telegram: true, whatsapp: true, email: true };
    expect(effectiveAvailability(admin, configured)).toEqual({
      telegram: false,
      whatsapp: true,
      email: true,
    });
  });
});
