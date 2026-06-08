import { describe, expect, it } from "vitest";
import { composeEventAlert } from "../src/domain/alert-text";

describe("composeEventAlert", () => {
  it("başlıkta konu + 'gerçekleşti', gövdede açıklama", () => {
    const a = composeEventAlert({
      canonicalQuery: "izmir deprem",
      description: "Ege'de 5.1 deprem",
    });
    expect(a.title).toContain("gerçekleşti");
    expect(a.title).toContain("izmir deprem");
    expect(a.body).toBe("Ege'de 5.1 deprem");
  });

  it("uzun konuyu kısaltır; boş açıklamada fallback gövde", () => {
    const a = composeEventAlert({ canonicalQuery: "x".repeat(80), description: "   " });
    expect(a.title.length).toBeLessThan(80);
    expect(a.body).toContain("gerçekleşti");
  });
});
