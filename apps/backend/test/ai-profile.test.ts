import { describe, expect, it } from "vitest";
import { createContainer } from "../src/config/container";
import type { Env } from "../src/config/env";
import { aiProfileContext } from "../src/domain/ai-profile";
import { createApp } from "../src/interfaces/http/app";

// ADR-113: kullanıcı AI kişiselleştirme — GET/PUT + bağlam üretimi.
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
const auth = (uid: string): Record<string, string> => ({ Authorization: `Bearer ${uid}` });
const jsonAuth = (uid: string): Record<string, string> => ({
  ...auth(uid),
  "Content-Type": "application/json",
});

describe("AI kişiselleştirme (ADR-113)", () => {
  it("GET varsayılan boş", async () => {
    const res = await makeApp().request("/v1/me/ai-profile", { headers: auth("u") });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ about: "", attention: "" });
  });

  it("PUT persists + GET yansır (tek konteyner)", async () => {
    const app = makeApp();
    const put = await app.request("/v1/me/ai-profile", {
      method: "PUT",
      headers: jsonAuth("u"),
      body: JSON.stringify({ about: "E-ticaret satıcısıyım", attention: "Fiyat değişimi" }),
    });
    expect(put.status).toBe(200);
    const g = (await (await app.request("/v1/me/ai-profile", { headers: auth("u") })).json()) as {
      about: string;
      attention: string;
    };
    expect(g).toEqual({ about: "E-ticaret satıcısıyım", attention: "Fiyat değişimi" });
  });

  it("aiProfileContext: boş → null, dolu → metin (about+attention)", () => {
    expect(aiProfileContext({ about: "", attention: "" })).toBeNull();
    const ctx = aiProfileContext({ about: "satıcı", attention: "stok" });
    expect(ctx).toContain("satıcı");
    expect(ctx).toContain("stok");
  });
});
