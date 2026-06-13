import { describe, expect, it } from "vitest";
import { createContainer } from "../src/config/container";
import type { Env } from "../src/config/env";
import { createApp } from "../src/interfaces/http/app";

// ADR-101: Kullanıcı 360° detay ucu — yetki + bulunamadı yolları (in-memory null döner).
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

describe("admin kullanıcı detayı (ADR-101)", () => {
  it("admin olmayan → 403", async () => {
    const res = await makeApp().request("/v1/admin/users/someone", { headers: bearer("user") });
    expect(res.status).toBe(403);
  });

  it("admin + bilinmeyen kullanıcı → 404 (in-memory)", async () => {
    const res = await makeApp().request("/v1/admin/users/ghost", { headers: bearer("boss") });
    expect(res.status).toBe(404);
    expect(((await res.json()) as { error: string }).error).toContain("bulunamadı");
  });
});
