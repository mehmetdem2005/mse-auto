import { describe, expect, it } from "vitest";
import { createContainer } from "../src/config/container";
import type { Env } from "../src/config/env";
import { createApp } from "../src/interfaces/http/app";

// ADR-103: gelir & büyüme + CSV dışa aktarım — yetki kapısı + sözleşme şekli
// (in-memory stub sıfır döner; gerçek toplama Supabase adapter'da, canlı doğrulanır).
function makeApp(): ReturnType<typeof createApp> {
  const env: Env = {
    NODE_ENV: "development",
    PORT: 3000,
    RATE_LIMIT_PER_MINUTE: 1000,
    WATCH_CREATE_PER_HOUR: 1000,
    ASSIST_PER_MINUTE: 1000,
    ADMIN_USER_IDS: "boss",
  };
  return createApp(createContainer(env));
}
const bearer = (uid: string): Record<string, string> => ({ Authorization: `Bearer ${uid}` });

describe("admin büyüme & CSV (ADR-103)", () => {
  it("growth: admin olmayan → 403", async () => {
    const res = await makeApp().request("/v1/admin/growth?days=30", { headers: bearer("user") });
    expect(res.status).toBe(403);
  });

  it("growth: admin → 200 + sözleşme şekli (days yansıtılır)", async () => {
    const res = await makeApp().request("/v1/admin/growth?days=30", { headers: bearer("boss") });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      days: number;
      signups: unknown[];
      funnel: { free: number; pro: number; conversionRate: number };
      churn: { canceled: number };
      mrrCents: number;
    };
    expect(body.days).toBe(30);
    expect(Array.isArray(body.signups)).toBe(true);
    expect(body.funnel).toHaveProperty("conversionRate");
    expect(body.churn).toHaveProperty("canceled");
    expect(typeof body.mrrCents).toBe("number");
  });

  it("CSV: admin olmayan → 403 (PII korunur)", async () => {
    const res = await makeApp().request("/v1/admin/export/users.csv", { headers: bearer("user") });
    expect(res.status).toBe(403);
  });

  it("CSV: admin → text/csv + attachment + başlık satırı", async () => {
    const res = await makeApp().request("/v1/admin/export/users.csv", { headers: bearer("boss") });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(res.headers.get("content-disposition")).toContain("attachment");
    const text = await res.text();
    expect(text.split("\n")[0]).toBe("id,email,createdAt,plan,isAdmin,watchCount");
  });
});
