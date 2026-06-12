import { describe, expect, it } from "vitest";
import { assistIntent } from "../src/application/assist-intent";
import { runTopicCheck } from "../src/application/run-topic-check";
import type { Checker } from "../src/domain/checker";
import type { AssistantMessage } from "../src/domain/intent-assistant";
import { summarizeTraffic, windowStart } from "../src/domain/traffic";
import type { Watch } from "../src/domain/watch";
import { InMemoryMonitoringRepository } from "../src/infrastructure/in-memory/monitoring.repo";
import { InMemoryStore } from "../src/infrastructure/in-memory/store";
import { InMemoryTrafficRepository } from "../src/infrastructure/in-memory/traffic.repo";
import { InMemoryWatchRepository } from "../src/infrastructure/in-memory/watch.repo";

const hitChecker: Checker = {
  async check() {
    return {
      detected: true,
      description: "olay gerçekleşti",
      resultSummary: "özet",
      reasoning: "kaynaklı",
      confidence: 0.9,
      facts: null,
    };
  },
};

function watchSeed(over: Partial<Watch>): Watch {
  return {
    id: "w1",
    userId: "u1",
    rawIntent: "x olunca haber ver",
    canonicalTopicId: "t1",
    archetype: "shared",
    frequencyMinutes: 60,
    status: "active",
    createdAt: new Date().toISOString(),
    sourcePref: "auto",
    deepScan: false,
    stopAfterHit: true,
    completedAt: null,
    ...over,
  };
}

function harness(watches: Watch[]) {
  const store = new InMemoryStore();
  store.topics.set("t1", { id: "t1", canonicalQuery: "x", lastCheckedAt: null });
  store.watches.push(...watches);
  return {
    monitoring: new InMemoryMonitoringRepository(store),
    watchesRepo: new InMemoryWatchRepository(store),
    store,
  };
}
const topic = { id: "t1", canonicalQuery: "x", lastCheckedAt: null };

describe("ADR-092 — sonuç bulununca durdur", () => {
  it("paylaşılan + stopAfterHit AÇIK: tespitten sonra izleme duraklatılır ve completedAt yazılır", async () => {
    const h = harness([watchSeed({})]);
    const r = await runTopicCheck(
      { checker: hitChecker, monitoring: h.monitoring, watches: h.watchesRepo },
      topic,
    );
    expect(r.detected).toBe(true);
    expect(r.deliveries).toBe(1); // teslim ÖNCE oluşur, sonra durdurulur — bildirim kaybolmaz
    const w = await h.watchesRepo.findById("w1");
    expect(w?.status).toBe("paused");
    expect(w?.completedAt).toBeTruthy();
  });

  it("stopAfterHit KAPALI: izleme aktif kalır (sürekli izleme tercihi)", async () => {
    const h = harness([watchSeed({ stopAfterHit: false })]);
    await runTopicCheck(
      { checker: hitChecker, monitoring: h.monitoring, watches: h.watchesRepo },
      topic,
    );
    expect((await h.watchesRepo.findById("w1"))?.status).toBe("active");
  });

  it("kişisel arketip sunucuda DURDURULMAZ (eşleşme kararı cihazda — P1)", async () => {
    const h = harness([watchSeed({ archetype: "personal" })]);
    await runTopicCheck(
      { checker: hitChecker, monitoring: h.monitoring, watches: h.watchesRepo },
      topic,
    );
    expect((await h.watchesRepo.findById("w1"))?.status).toBe("active");
  });

  it("watches dep verilmezse davranış değişmez (geri-uyum)", async () => {
    const h = harness([watchSeed({})]);
    await runTopicCheck({ checker: hitChecker, monitoring: h.monitoring }, topic);
    expect((await h.watchesRepo.findById("w1"))?.status).toBe("active");
  });

  it("duraklatılan izleme scheduler'da konuyu düşürür → tarama gerçekten durur", async () => {
    const h = harness([watchSeed({})]);
    await runTopicCheck(
      { checker: hitChecker, monitoring: h.monitoring, watches: h.watchesRepo },
      topic,
    );
    const due = await h.monitoring.findTopicsDueForCheck(new Date(Date.now() + 3_600_000 * 24));
    expect(due).toHaveLength(0);
  });
});

describe("ADR-091 — kimliksiz trafik telemetrisi", () => {
  it("kaydeder ve gün/kaynak/ref kırılımıyla özetler (site ve app AYRI)", async () => {
    const repo = new InMemoryTrafficRepository();
    const today = new Date().toISOString().slice(0, 10);
    await repo.record({
      day: today,
      source: "site",
      ref: "google.com",
      utm: null,
      path: "/",
      lang: "tr",
      platform: null,
    });
    await repo.record({
      day: today,
      source: "site",
      ref: "google.com",
      utm: "chatgpt.com",
      path: "/cozumler/",
      lang: "tr",
      platform: null,
    });
    await repo.record({
      day: today,
      source: "app",
      ref: null,
      utm: null,
      path: null,
      lang: "en",
      platform: "android",
    });
    const sum = summarizeTraffic(await repo.listSince(windowStart(7)), 7);
    expect(sum.site.total).toBe(2);
    expect(sum.app.total).toBe(1);
    expect(sum.site.refs[0]).toEqual({ key: "google.com", count: 2 });
    expect(sum.app.platforms[0]).toEqual({ key: "android", count: 1 });
    expect(sum.days).toHaveLength(7);
    expect(sum.days.at(-1)?.site).toBe(2);
    expect(sum.days.at(-1)?.app).toBe(1);
  });

  it("pencere dışı günler özete girmez", async () => {
    const repo = new InMemoryTrafficRepository();
    await repo.record({
      day: "2000-01-01",
      source: "site",
      ref: null,
      utm: null,
      path: "/",
      lang: null,
      platform: null,
    });
    const sum = summarizeTraffic(await repo.listSince(windowStart(7)), 7);
    expect(sum.site.total).toBe(0);
  });
});

describe("ADR-093 — asistan dile-uyum", () => {
  it("lang parametresi asistana iletilir", async () => {
    let seenLang: string | undefined;
    const reply = {
      ready: false,
      message: "soru",
      intent: null,
      frequencyMinutes: null,
      confidence: 0.5,
    };
    const deps = {
      assistant: {
        async chat(_h: AssistantMessage[], lang?: string) {
          seenLang = lang;
          return reply;
        },
      },
    };
    await assistIntent(deps, { messages: [{ role: "user", content: "merhaba" }], lang: "de" });
    expect(seenLang).toBe("de");
  });
});

// ---- HTTP yüzeyi: beacon + admin trafik koruması (ADR-091) ----
import { createContainer } from "../src/config/container";
import type { Env } from "../src/config/env";
import { createApp } from "../src/interfaces/http/app";

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

describe("HTTP — /t beacon ve /v1/admin/traffic", () => {
  it("POST /t auth'suz 204 döner (sendBeacon text/plain) ve admin özetinde görünür", async () => {
    const app = makeApp("admin1");
    const res = await app.request("/t", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ source: "site", path: "/", ref: "https://www.google.com/search" }),
    });
    expect(res.status).toBe(204);

    const traffic = await app.request("/v1/admin/traffic?days=7", {
      headers: { Authorization: "Bearer admin1" },
    });
    expect(traffic.status).toBe(200);
    const body = (await traffic.json()) as { site: { total: number; refs: { key: string }[] } };
    expect(body.site.total).toBe(1);
    expect(body.site.refs[0]?.key).toBe("google.com"); // www + yol kırpıldı, yalnız alan adı
  });

  it("bozuk gövde bile 204 (probe'a bilgi sızdırma yok); admin ucu admin-dışına 403", async () => {
    const app = makeApp("admin1");
    const bad = await app.request("/t", { method: "POST", body: "geçersiz json" });
    expect(bad.status).toBe(204);
    const res = await app.request("/v1/admin/traffic", {
      headers: { Authorization: "Bearer normal-user" },
    });
    expect(res.status).toBe(403);
  });
});
