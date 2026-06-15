import { describe, expect, it } from "vitest";
import { redactPii } from "../src/infrastructure/logging/logger";

// ADR-141: log PII redaksiyonu — derinlemesine-savunma (P1 "0 PII egress").
describe("logger PII redaksiyonu (ADR-141)", () => {
  it("duyarlı ANAHTARLAR tamamen redakte edilir", () => {
    const out = redactPii({
      authorization: "Bearer eyJhbGciOi.abc.def",
      token: "sbp_0123456789abcdef",
      email: "ada@example.com",
      apiKey: "sk-secret",
    });
    expect(out).toEqual({
      authorization: "[redacted]",
      token: "[redacted]",
      email: "[redacted]",
      apiKey: "[redacted]",
    });
  });

  it("serbest-metin DEĞER içindeki e-posta/Bearer/jeton maskelenir (hata yolu)", () => {
    const out = redactPii({
      message: "compose failed for ada@example.com using Bearer eyJabc.def.ghi",
      stack: "Error: sbp_0123456789abcdefghij at file.ts",
    });
    expect(out.message).not.toContain("ada@example.com");
    expect(out.message).toContain("[email]");
    expect(out.message).toContain("Bearer [redacted]");
    expect(String(out.stack)).toContain("[token]");
    expect(String(out.stack)).not.toContain("sbp_0123456789abcdefghij");
  });

  it("ADR-150: uzun hash/slug yanlışlıkla maskelenmez (gözlemlenebilirlik) — yalnız öneki-bilinen sırlar", () => {
    const hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"; // sha256 (64 hex)
    const out = redactPii({ message: `digest ${hash} path /reports/2026-q2-summary-export-final` });
    expect(out.message).toContain(hash); // 40+ genel-yakalayıcı kaldırıldı → hash korunur
    expect(out.message).not.toContain("[token]");
    // Öneki-bilinen sır YİNE maskelenir:
    expect(redactPii({ m: "key sk-abcdef0123456789" }).m as string).toContain("[token]");
  });

  it("iç içe nesnelerde de redakte eder", () => {
    const out = redactPii({ meta: { secret: "x", nested: { email: "a@b.com" } }, plan: "pro" });
    expect(out).toEqual({
      meta: { secret: "[redacted]", nested: { email: "[redacted]" } },
      plan: "pro",
    });
  });

  it("PII OLMAYAN alanlar (opaque userId/requestId UUID, sayılar) DEĞİŞMEZ", () => {
    const fields = {
      requestId: "f7584586-6d61-4e73-b05d-3314f7c871d8",
      userId: "2bd8f150-f434-4809-a141-6f89eab1bd49",
      method: "GET",
      path: "/v1/admin/users/abc123",
      status: 200,
      ms: 5,
    };
    expect(redactPii(fields)).toEqual(fields);
  });
});
