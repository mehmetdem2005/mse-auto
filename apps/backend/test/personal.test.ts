import { describe, expect, it } from "vitest";
import {
  type EventFacts,
  evaluateCriterion,
  haversineKm,
  personalCriterionSchema,
} from "../src/domain/personal";

const IST = { lat: 41.0082, lng: 28.9784 };
const ANK = { lat: 39.9334, lng: 32.8597 };

describe("arketip-B değerlendirici (kriter × facts)", () => {
  it("haversine İstanbul–Ankara ~349km", () => {
    expect(haversineKm(IST, ANK)).toBeGreaterThan(340);
    expect(haversineKm(IST, ANK)).toBeLessThan(360);
  });

  it("geo_radius: yarıçap içinde eşleşir, dışında eşleşmez", () => {
    const facts: EventFacts = { geo: ANK };
    expect(evaluateCriterion({ kind: "geo_radius", ...IST, radiusKm: 400 }, facts).matched).toBe(
      true,
    );
    expect(evaluateCriterion({ kind: "geo_radius", ...IST, radiusKm: 100 }, facts).matched).toBe(
      false,
    );
  });

  it("geo_radius: konum facts yoksa eşleşmez (+sebep)", () => {
    const r = evaluateCriterion({ kind: "geo_radius", ...IST, radiusKm: 50 }, {});
    expect(r.matched).toBe(false);
    expect(r.reason).toContain("konum");
  });

  it("numeric_below: eşik altı eşleşir, üstü eşleşmez", () => {
    expect(
      evaluateCriterion({ kind: "numeric_below", threshold: 50000 }, { numeric: 45000 }).matched,
    ).toBe(true);
    expect(
      evaluateCriterion({ kind: "numeric_below", threshold: 50000 }, { numeric: 55000 }).matched,
    ).toBe(false);
  });

  it("numeric_above: eşik üstü eşleşir", () => {
    expect(
      evaluateCriterion({ kind: "numeric_above", threshold: 100 }, { numeric: 120 }).matched,
    ).toBe(true);
    expect(
      evaluateCriterion({ kind: "numeric_above", threshold: 100 }, { numeric: 80 }).matched,
    ).toBe(false);
  });

  it("numeric: para birimi uyumsuzsa eşleşmez", () => {
    const r = evaluateCriterion(
      { kind: "numeric_below", threshold: 50000, currency: "usd" },
      { numeric: 1, currency: "try" },
    );
    expect(r.matched).toBe(false);
    expect(r.reason).toContain("para birimi");
  });

  it("numeric: sayısal facts yoksa eşleşmez", () => {
    expect(evaluateCriterion({ kind: "numeric_below", threshold: 1 }, {}).matched).toBe(false);
  });

  it("keyword: herhangi biri metinde geçerse eşleşir (case-insensitive)", () => {
    const c = { kind: "keyword", anyOf: ["zam", "indirim"] } as const;
    expect(evaluateCriterion(c, { text: "Büyük İNDİRİM başladı" }).matched).toBe(true);
    expect(evaluateCriterion(c, { text: "sıradan haber" }).matched).toBe(false);
  });

  it("zod: geçerli kriteri kabul, geçersizi (negatif yarıçap) reddeder", () => {
    expect(
      personalCriterionSchema.safeParse({ kind: "geo_radius", lat: 41, lng: 29, radiusKm: 10 })
        .success,
    ).toBe(true);
    expect(
      personalCriterionSchema.safeParse({ kind: "geo_radius", lat: 41, lng: 29, radiusKm: -5 })
        .success,
    ).toBe(false);
  });
});
