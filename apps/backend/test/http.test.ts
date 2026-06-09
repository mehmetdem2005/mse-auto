import type { Me, Subscription, Watch } from "@watcher/contracts";
import { describe, expect, it } from "vitest";
import { createContainer } from "../src/config/container";
import type { Env } from "../src/config/env";
import { createApp } from "../src/interfaces/http/app";

// Her test için taze app (taze in-memory store) → izolasyon. Rate-limit yüksek tutulur.
function makeApp(admins?: string): ReturnType<typeof createApp> {
  const env: Env = {
    NODE_ENV: "development",
    PORT: 3000,
    RATE_LIMIT_PER_MINUTE: 1000,
    WATCH_CREATE_PER_HOUR: 1000,
    ...(admins ? { ADMIN_USER_IDS: admins } : {}),
  };
  return createApp(createContainer(env));
}

const bearer = (uid: string): Record<string, string> => ({ Authorization: `Bearer ${uid}` });
function post(body: unknown, uid: string): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json", ...bearer(uid) },
    body: JSON.stringify(body),
  };
}

describe("HTTP API (in-memory + dev auth)", () => {
  it("GET /health açık → 200", async () => {
    const res = await makeApp().request("/health");
    expect(res.status).toBe(200);
    expect(((await res.json()) as { status: string }).status).toBe("ok");
  });

  it("/v1/* auth yoksa veya başlık bozuksa → 401", async () => {
    const app = makeApp();
    expect((await app.request("/v1/me")).status).toBe(401);
    const bad = await app.request("/v1/me", { headers: { Authorization: "Token x" } });
    expect(bad.status).toBe(401);
  });

  it("GET /v1/me → 200; dev'de token = userId", async () => {
    const res = await makeApp().request("/v1/me", { headers: bearer("u1") });
    expect(res.status).toBe(200);
    const me = (await res.json()) as Me;
    expect(me.userId).toBe("u1");
    expect(me.isAdmin).toBe(false);
  });

  it("GET /v1/subscription → free; sunum özellikleri kapalı", async () => {
    const res = await makeApp().request("/v1/subscription", { headers: bearer("u1") });
    expect(res.status).toBe(200);
    const s = (await res.json()) as Subscription;
    expect(s.plan).toBe("free");
    expect(s.entitlements.alarmChannel).toBe(false);
    expect(s.entitlements.personalFilters).toBe(false);
    expect(s.limits.maxActiveWatches).toBe(3);
    expect(s.usage.activeWatches).toBe(0);
  });

  it("POST /v1/watchers geçerli → 201; sonra liste 1 döner", async () => {
    const app = makeApp();
    const res = await app.request(
      "/v1/watchers",
      post({ rawIntent: "İzmir'de deprem olunca haber ver", frequencyMinutes: 60 }, "u1"),
    );
    expect(res.status).toBe(201);
    const w = (await res.json()) as Watch;
    expect(w.id).toBeTruthy();
    expect(w.archetype).toBeTruthy();
    const list = await app.request("/v1/watchers", { headers: bearer("u1") });
    expect(((await list.json()) as Watch[]).length).toBe(1);
  });

  it("POST /v1/watchers geçersiz gövde (rawIntent yok) → 400", async () => {
    const res = await makeApp().request("/v1/watchers", post({ frequencyMinutes: 60 }, "u1"));
    expect(res.status).toBe(400);
  });

  it("POST /v1/watchers plan limiti (free < 60 dk) → 403", async () => {
    const res = await makeApp().request(
      "/v1/watchers",
      post({ rawIntent: "çok sık kontrol", frequencyMinutes: 30 }, "u1"),
    );
    expect(res.status).toBe(403);
    expect((await res.json()) as { error: string }).toHaveProperty("error");
  });

  it("POST /v1/subscription → 503 (ödeme entegrasyonu kapalı)", async () => {
    const app = makeApp();
    const res = await app.request(
      "/v1/subscription",
      post({ plan: "pro", interval: "month" }, "u1"),
    );
    // Ödeme akışı bilinçli devre dışı (subscription.route.ts → 503). Ödeme
    // açıldığında bu testi 200 + entitlements doğrulamasına geri çevir.
    expect(res.status).toBe(503);
    expect((await res.json()) as { error: string }).toHaveProperty("error");
  });

  it("POST /v1/devices → 201; ok", async () => {
    const res = await makeApp().request("/v1/devices", post({ fcmToken: "tok-1" }, "u1"));
    expect(res.status).toBe(201);
    expect(((await res.json()) as { ok: boolean }).ok).toBe(true);
  });

  it("admin: admin olmayan → 403; admin → 200", async () => {
    const denied = await makeApp().request("/v1/admin/analytics", { headers: bearer("u1") });
    expect(denied.status).toBe(403);
    const ok = await makeApp("admin1").request("/v1/admin/analytics", {
      headers: bearer("admin1"),
    });
    expect(ok.status).toBe(200);
  });

  it("GET /openapi.json → 200; yol tanımları içerir", async () => {
    const res = await makeApp().request("/openapi.json");
    expect(res.status).toBe(200);
    const doc = (await res.json()) as { openapi: string; paths: Record<string, unknown> };
    expect(doc.openapi).toBe("3.0.0");
    expect(Object.keys(doc.paths).length).toBeGreaterThan(0);
  });
});
