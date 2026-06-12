import type { Me, Subscription, Watch } from "@watcher/contracts";
import { describe, expect, it } from "vitest";
import { registerMonitoringWorker } from "../src/application/monitoring-worker";
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
    ASSIST_PER_MINUTE: 1000,
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

  it("watcher assist: muğlak → netleştirme sorusu; spesifik → hazır niyet (heuristic)", async () => {
    // Selamlama balonu başta olsa bile muğlak ilk istekte soru sorulmalı.
    const vague = await makeApp().request(
      "/v1/watchers/assist",
      post(
        {
          messages: [
            { role: "assistant", content: "Merhaba! Ne olduğunda haber vereyim?" },
            { role: "user", content: "telefon" },
          ],
        },
        "u1",
      ),
    );
    expect(vague.status).toBe(200);
    const vb = (await vague.json()) as { ready: boolean; message: string; intent: string | null };
    expect(vb.ready).toBe(false);
    expect(vb.intent).toBeNull();
    expect(vb.message.length).toBeGreaterThan(0);

    const specific = await makeApp().request(
      "/v1/watchers/assist",
      post(
        {
          messages: [
            { role: "user", content: "telefon fiyatı" },
            { role: "assistant", content: "hangi model ve hangi eşik?" },
            { role: "user", content: "iPhone 17 Pro fiyatı 50000 TL altına inince haber ver" },
          ],
        },
        "u1",
      ),
    );
    const sb = (await specific.json()) as {
      ready: boolean;
      intent: string | null;
      frequencyMinutes: number | null;
    };
    expect(sb.ready).toBe(true);
    expect(sb.intent).toBeTruthy();
    expect(sb.frequencyMinutes).toBeGreaterThan(0);
  });

  it("watcher oluşturulunca ilk kontrol ANINDA koşar (kuyruk auto-pump)", async () => {
    // Worker kayıtlı tam kurulum: enqueue → in-memory auto-pump → StubChecker koşar.
    const env: Env = {
      NODE_ENV: "development",
      PORT: 3000,
      RATE_LIMIT_PER_MINUTE: 1000,
      WATCH_CREATE_PER_HOUR: 1000,
      ASSIST_PER_MINUTE: 1000,
    };
    const container = createContainer(env);
    await registerMonitoringWorker({
      queue: container.queue,
      monitoring: container.monitoring,
      checker: container.checker,
    });
    const app = createApp(container);
    const res = await app.request(
      "/v1/watchers",
      post({ rawIntent: "yeni bir konuyu izle hemen", frequencyMinutes: 60 }, "u1"),
    );
    expect(res.status).toBe(201);
    const w = (await res.json()) as Watch;
    const tl = await app.request(`/v1/watchers/${w.id}/timeline`, { headers: bearer("u1") });
    expect(tl.status).toBe(200);
    const body = (await tl.json()) as { checkRuns: unknown[] };
    expect(body.checkRuns.length).toBeGreaterThanOrEqual(1);
  });

  it("watcher duraklat/sürdür + sil: sahip 200; başkası 404; limit dolarken sürdür 403", async () => {
    const app = makeApp();
    const mk = (intent: string) =>
      app.request("/v1/watchers", post({ rawIntent: intent, frequencyMinutes: 60 }, "u1"));
    const w1 = (await (await mk("birinci konu izle")).json()) as Watch;

    // duraklat (sahip) → 200, status döner
    const paused = await app.request(
      `/v1/watchers/${w1.id}/status`,
      post({ status: "paused" }, "u1"),
    );
    expect(paused.status).toBe(200);
    expect(((await paused.json()) as Watch).status).toBe("paused");

    // başkası dokunamaz → 404
    const foreign = await app.request(
      `/v1/watchers/${w1.id}/status`,
      post({ status: "active" }, "u2"),
    );
    expect(foreign.status).toBe(404);
    const foreignDel = await app.request(`/v1/watchers/${w1.id}`, {
      method: "DELETE",
      headers: bearer("u2"),
    });
    expect(foreignDel.status).toBe(404);

    // free limiti (3) doluyken duraklatılmışı sürdürmek → 403
    await mk("ikinci konu izle");
    await mk("üçüncü konu izle");
    await mk("dördüncü konu izle"); // w1 paused olduğundan 3 aktif olur
    const resume = await app.request(
      `/v1/watchers/${w1.id}/status`,
      post({ status: "active" }, "u1"),
    );
    expect(resume.status).toBe(403);

    // sil (sahip) → 200; listeden düşer
    const del = await app.request(`/v1/watchers/${w1.id}`, {
      method: "DELETE",
      headers: bearer("u1"),
    });
    expect(del.status).toBe(200);
    const list = (await (
      await app.request("/v1/watchers", { headers: bearer("u1") })
    ).json()) as Watch[];
    expect(list.find((w) => w.id === w1.id)).toBeUndefined();
  });

  it("assist rate-limit izolasyonu: createWatch kotası dolu olsa da /assist çalışır", async () => {
    // Hono use() exact-match regresyonu: /v1/watchers middleware'i /assist'e sızmamalı.
    const env: Env = {
      NODE_ENV: "development",
      PORT: 3000,
      RATE_LIMIT_PER_MINUTE: 1000,
      WATCH_CREATE_PER_HOUR: 1,
      ASSIST_PER_MINUTE: 1000,
    };
    const app = createApp(createContainer(env));
    const w1 = await app.request(
      "/v1/watchers",
      post({ rawIntent: "İzmir'de deprem olunca haber ver", frequencyMinutes: 60 }, "u1"),
    );
    expect(w1.status).toBe(201);
    const w2 = await app.request(
      "/v1/watchers",
      post({ rawIntent: "başka bir konu olunca", frequencyMinutes: 60 }, "u1"),
    );
    expect(w2.status).toBe(429); // createWatch kotası doldu
    const a = await app.request(
      "/v1/watchers/assist",
      post(
        { messages: [{ role: "user", content: "iPhone 17 Pro 50000 TL altına düşünce" }] },
        "u1",
      ),
    );
    expect(a.status).toBe(200); // assist ayrı kovada, etkilenmez
  });

  it("admin timeseries: gün sayısı kadar nokta + sıfır toplamlar (in-memory)", async () => {
    const res = await makeApp("admin1").request("/v1/admin/timeseries?days=7", {
      headers: bearer("admin1"),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      days: number;
      points: { date: string; checkRuns: number }[];
      totals: { checkRuns: number; detections: number; deliveries: number };
    };
    expect(body.points).toHaveLength(7);
    expect(body.days).toBe(7);
    expect(body.totals).toEqual({ checkRuns: 0, detections: 0, deliveries: 0 });
    // tarihler eskiden yeniye, ISO gün biçimi
    expect(body.points[0].date < body.points[6].date).toBe(true);
    expect(body.points[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("GET /v1/me/stats: watcher sayısı + 24s tarama (ADR-049)", async () => {
    const env: Env = {
      NODE_ENV: "development",
      PORT: 3000,
      RATE_LIMIT_PER_MINUTE: 1000,
      WATCH_CREATE_PER_HOUR: 1000,
      ASSIST_PER_MINUTE: 1000,
    };
    const container = createContainer(env);
    await registerMonitoringWorker({
      queue: container.queue,
      monitoring: container.monitoring,
      checker: container.checker,
    });
    const app = createApp(container);
    await app.request(
      "/v1/watchers",
      post({ rawIntent: "istatistik konusu izle", frequencyMinutes: 60 }, "u1"),
    );
    const res = await app.request("/v1/me/stats", { headers: bearer("u1") });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      watchers: number;
      activeWatchers: number;
      checks24h: number;
    };
    expect(body.watchers).toBe(1);
    expect(body.activeWatchers).toBe(1);
    expect(body.checks24h).toBeGreaterThanOrEqual(1); // anında ilk kontrol koştu
  });

  it("destek akışı: talep aç → admin listeler/yanıtlar → sahip görür; yabancı 404", async () => {
    const app = makeApp("admin1");
    // kullanıcı canlı talep açar
    const created = await app.request(
      "/v1/support",
      post({ kind: "live", message: "Uygulama bildirim göndermiyor" }, "u1"),
    );
    expect(created.status).toBe(201);
    const t = (await created.json()) as { id: string; status: string; lastMessage: string };
    expect(t.status).toBe("open");
    expect(t.lastMessage).toContain("bildirim");

    // admin listede görür
    const adminList = await app.request("/v1/admin/support", { headers: bearer("admin1") });
    expect(adminList.status).toBe(200);
    const rows = (await adminList.json()) as { id: string }[];
    expect(rows.some((r) => r.id === t.id)).toBe(true);

    // admin yanıtlar → sahip mesajlarda görür
    const reply = await app.request(
      `/v1/admin/support/${t.id}/reply`,
      post({ body: "Merhaba, bakıyoruz." }, "admin1"),
    );
    expect(reply.status).toBe(201);
    const msgs = await app.request(`/v1/support/${t.id}/messages`, { headers: bearer("u1") });
    const list = (await msgs.json()) as { sender: string; body: string }[];
    expect(list).toHaveLength(2);
    expect(list[1]?.sender).toBe("admin");

    // yabancı kullanıcı talebi göremez/yazamaz → 404
    const foreign = await app.request(`/v1/support/${t.id}/messages`, { headers: bearer("u2") });
    expect(foreign.status).toBe(404);

    // admin kapatır
    const closed = await app.request(`/v1/admin/support/${t.id}/close`, {
      method: "POST",
      headers: bearer("admin1"),
    });
    expect(closed.status).toBe(200);
    const mine = (await (await app.request("/v1/support", { headers: bearer("u1") })).json()) as {
      id: string;
      status: string;
    }[];
    expect(mine.find((x) => x.id === t.id)?.status).toBe("closed");
  });

  it("GET /openapi.json → 200; yol tanımları içerir", async () => {
    const res = await makeApp().request("/openapi.json");
    expect(res.status).toBe(200);
    const doc = (await res.json()) as { openapi: string; paths: Record<string, unknown> };
    expect(doc.openapi).toBe("3.0.0");
    expect(Object.keys(doc.paths).length).toBeGreaterThan(0);
  });

  it("tanımsız yol → 404 sözleşme zarfı ({error, requestId})", async () => {
    const app = makeApp();
    const open = await app.request("/olmayan-yol");
    expect(open.status).toBe(404);
    const body = (await open.json()) as { error: string; requestId?: string };
    expect(body.error.length).toBeGreaterThan(0);
    expect(body.requestId).toBeTruthy();
    // /v1 altında da (auth'lu) aynı zarf
    const v1 = await app.request("/v1/olmayan-yol", { headers: bearer("u1") });
    expect(v1.status).toBe(404);
    expect(((await v1.json()) as { error: string }).error.length).toBeGreaterThan(0);
  });

  it("güvenlik başlıkları her yanıtta (nosniff, frame-deny, HSTS, permissions)", async () => {
    const res = await makeApp().request("/health");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    expect(res.headers.get("referrer-policy")).toBe("no-referrer");
    expect(res.headers.get("strict-transport-security")).toContain("max-age=");
    expect(res.headers.get("permissions-policy")).toContain("camera=()");
  });

  it("x-request-id: gelen taşınır, gelmeyen üretilir", async () => {
    const app = makeApp();
    const echoed = await app.request("/health", { headers: { "x-request-id": "test-iz-42" } });
    expect(echoed.headers.get("x-request-id")).toBe("test-iz-42");
    const generated = await app.request("/health");
    expect(generated.headers.get("x-request-id")).toBeTruthy();
  });

  it("1 MB üstü gövde → 413 sözleşme zarfı (bodyLimit)", async () => {
    const big = "x".repeat(1024 * 1024 + 1);
    const res = await makeApp().request("/v1/watchers", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...bearer("u1") },
      body: JSON.stringify({ rawIntent: big, frequencyMinutes: 60 }),
    });
    expect(res.status).toBe(413);
    const body = (await res.json()) as { error: string; requestId?: string };
    expect(body.error.length).toBeGreaterThan(0);
    expect(body.requestId).toBeTruthy();
  });

  it("webhook: gövde çözümlenemezse 400 (parse hatası ≠ işleme hatası)", async () => {
    // In-memory gateway imza istemez ama bozuk JSON parse'ta fırlatır → 400.
    // Geçerli-ama-bilinmeyen olay ise 'ignored' sayılır → 200 (sağlayıcı retry etmez).
    const app = makeApp();
    const bad = await app.request("/webhooks/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "bozuk-json{",
    });
    expect(bad.status).toBe(400);
    const ignored = await app.request("/webhooks/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "evt" }),
    });
    expect(ignored.status).toBe(200);
  });
});
