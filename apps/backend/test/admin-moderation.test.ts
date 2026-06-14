import { describe, expect, it } from "vitest";
import { createContainer } from "../src/config/container";
import type { Env } from "../src/config/env";
import { createApp } from "../src/interfaces/http/app";

// ADR-104: moderasyon (ban + enforcement) + push yayın (dürüst pasif) + denetim günlüğü.
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

describe("admin moderasyon & denetim (ADR-104)", () => {
  it("ban → kullanıcı tüm /v1'de 403; unban → erişim geri gelir (tek konteyner)", async () => {
    const app = makeApp();
    const before = await app.request("/v1/me", { headers: auth("u") });
    expect(before.status).not.toBe(403); // ban öncesi erişebiliyor

    const banned = await app.request("/v1/admin/users/u/ban", {
      method: "POST",
      headers: jsonAuth("boss"),
      body: JSON.stringify({ banned: true }),
    });
    expect(banned.status).toBe(200);

    const blocked = await app.request("/v1/me", { headers: auth("u") });
    expect(blocked.status).toBe(403); // ban.middleware enforcement

    const unbanned = await app.request("/v1/admin/users/u/ban", {
      method: "POST",
      headers: jsonAuth("boss"),
      body: JSON.stringify({ banned: false }),
    });
    expect(unbanned.status).toBe(200);
    const after = await app.request("/v1/me", { headers: auth("u") });
    expect(after.status).not.toBe(403);
  });

  it("admin banlanamaz → 400 (öz-kilitlenme önlemi)", async () => {
    const res = await makeApp().request("/v1/admin/users/boss/ban", {
      method: "POST",
      headers: jsonAuth("boss"),
      body: JSON.stringify({ banned: true }),
    });
    expect(res.status).toBe(400);
  });

  it("broadcast: admin olmayan → 403", async () => {
    const res = await makeApp().request("/v1/admin/broadcast", {
      method: "POST",
      headers: jsonAuth("user"),
      body: JSON.stringify({ title: "Merhaba", body: "deneme", segment: "all" }),
    });
    expect(res.status).toBe(403);
  });

  it("broadcast: FCM yokken DÜRÜST 'inactive' döner (sayılar 0)", async () => {
    const res = await makeApp().request("/v1/admin/broadcast", {
      method: "POST",
      headers: jsonAuth("boss"),
      body: JSON.stringify({ title: "Merhaba", body: "deneme", segment: "all" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { channel: string; sent: number; recipients: number };
    expect(body.channel).toBe("inactive");
    expect(body.sent).toBe(0);
    expect(body.recipients).toBe(0);
  });

  it("denetim günlüğü: ban işlemi audit'e yazılır; admin okuyabilir", async () => {
    const app = makeApp();
    await app.request("/v1/admin/users/u/ban", {
      method: "POST",
      headers: jsonAuth("boss"),
      body: JSON.stringify({ banned: true }),
    });
    const res = await app.request("/v1/admin/audit", { headers: auth("boss") });
    expect(res.status).toBe(200);
    const rows = (await res.json()) as { action: string; targetId: string; actorId: string }[];
    expect(rows.some((r) => r.action === "user.ban" && r.targetId === "u")).toBe(true);
    expect(rows[0]?.actorId).toBe("boss");
  });
});
