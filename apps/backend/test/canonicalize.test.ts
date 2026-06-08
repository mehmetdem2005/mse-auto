import { describe, expect, it } from "vitest";
import { canonicalize } from "../src/domain/canonicalize";

describe("canonicalize (dedup + PII + arketip)", () => {
  it("büyük/küçük harf ve boşluk farkını aynı kanonik sorguya indirger", () => {
    const a = canonicalize("iPhone 17 fiyatı");
    const b = canonicalize("iphone   17  fiyatı");
    expect(a.canonicalQuery).toBe(b.canonicalQuery);
    expect(a.canonicalQuery).toBe("iphone 17 fiyatı");
  });

  it("kişisel işaretçileri (TR+EN) personal arketipe ayırır", () => {
    expect(canonicalize("benim siparişim geldi mi").archetype).toBe("personal");
    expect(canonicalize("did my order arrive").archetype).toBe("personal");
  });

  it("genel olayları shared arketipe koyar", () => {
    expect(canonicalize("İzmir'de deprem oldu mu").archetype).toBe("shared");
  });

  it("uzun sayısal tanımlayıcıyı (PII) sıyırır ve personal sayar", () => {
    const r = canonicalize("bilet 98765 nerede");
    expect(r.archetype).toBe("personal");
    expect(r.canonicalQuery).not.toContain("98765");
    expect(r.canonicalQuery).toBe("bilet nerede");
  });
});
