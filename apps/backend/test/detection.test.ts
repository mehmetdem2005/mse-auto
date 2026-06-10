import { describe, expect, it } from "vitest";
import { dispatchEventDeliveries } from "../src/application/delivery";
import { runTopicCheck } from "../src/application/run-topic-check";
import type { Checker } from "../src/domain/checker";
import type { Notifier, PushMessage } from "../src/domain/notifier";
import { InMemoryMonitoringRepository } from "../src/infrastructure/in-memory/monitoring.repo";
import { InMemoryStore } from "../src/infrastructure/in-memory/store";
import { InMemoryCanonicalTopicRepository } from "../src/infrastructure/in-memory/topic.repo";

function seed() {
  const store = new InMemoryStore();
  store.topics.set("t1", { id: "t1", canonicalQuery: "deprem türkiye", lastCheckedAt: null });
  const now = new Date().toISOString();
  store.watches.push(
    {
      id: "w-shared",
      userId: "u1",
      rawIntent: "deprem oldu mu",
      canonicalTopicId: "t1",
      archetype: "shared",
      frequencyMinutes: 60,
      status: "active",
      createdAt: now,
    },
    {
      id: "w-personal",
      userId: "u2",
      rawIntent: "evime yakın deprem",
      canonicalTopicId: "t1",
      archetype: "personal",
      frequencyMinutes: 60,
      status: "active",
      createdAt: now,
    },
  );
  store.deviceTokens.push(
    { userId: "u1", token: "tok-u1", platform: "android" },
    { userId: "u2", token: "tok-u2", platform: "android" },
  );
  return store;
}

const FACTS = {
  geo: { lat: 38.4, lng: 26.9 },
  numeric: 5.1,
  numericKind: "magnitude",
  text: "Ege'de 5.1 deprem",
};
const checker: Checker = {
  async check() {
    return {
      detected: true,
      description: "Ege'de 5.1 deprem",
      resultSummary: "deprem",
      reasoning: "kaynak",
      confidence: 0.9,
      facts: FACTS,
    };
  },
};
const topic = { id: "t1", canonicalQuery: "deprem türkiye", lastCheckedAt: null };

describe("resmî kaynak çözümü + cache (ADR-046)", () => {
  it("ilk koşuda çözer ve kaydeder; ikinci koşuda resolver ÇAĞRILMAZ; ctx'e domain gider", async () => {
    const store = seed();
    const monitoring = new InMemoryMonitoringRepository(store);
    const topics = new InMemoryCanonicalTopicRepository(store);
    let resolveCalls = 0;
    const authority = {
      async resolve() {
        resolveCalls += 1;
        return { domain: "kurum.gov.tr", name: "Kurum" };
      },
    };
    const seenDomains: (string | null | undefined)[] = [];
    const capturing: Checker = {
      async check(_t, ctx) {
        seenDomains.push(ctx?.authorityDomain);
        return {
          detected: false,
          description: null,
          resultSummary: "x",
          reasoning: "r",
          confidence: 0.5,
        };
      },
    };
    await runTopicCheck({ checker: capturing, monitoring, topics, authority }, topic);
    await runTopicCheck({ checker: capturing, monitoring, topics, authority }, topic);
    expect(resolveCalls).toBe(1); // konu başına TEK çözüm (cache)
    expect(seenDomains).toEqual(["kurum.gov.tr", "kurum.gov.tr"]);
  });
});

describe("tekrar-bildirim bastırma (ADR-037)", () => {
  it("ikinci kontrolde checker'a son bildirilen olay verilir", async () => {
    const store = seed();
    const monitoring = new InMemoryMonitoringRepository(store);
    const seen: (string | null | undefined)[] = [];
    const capturing: Checker = {
      async check(_t, ctx) {
        seen.push(ctx?.lastEventDescription);
        return {
          detected: true,
          description: "Ege'de 5.1 deprem",
          resultSummary: "deprem",
          reasoning: "kaynak",
          confidence: 0.9,
        };
      },
    };
    await runTopicCheck({ checker: capturing, monitoring }, topic);
    await runTopicCheck({ checker: capturing, monitoring }, topic);
    expect(seen[0]).toBeNull(); // ilk koşuda önceki olay yok
    expect(seen[1]).toBe("Ege'de 5.1 deprem"); // ikinci koşu öncekini bilir
  });
});

describe("tespit → facts kalıcılığı + arketip-farkında fan-out", () => {
  it("detection_event facts'i saklar; her aboneye delivery üretir", async () => {
    const store = seed();
    const monitoring = new InMemoryMonitoringRepository(store);
    const result = await runTopicCheck({ checker, monitoring }, topic);
    expect(result.detected).toBe(true);
    expect(result.deliveries).toBe(2);
    expect(store.events[0]?.facts).toEqual(FACTS);
    const subs = await monitoring.listActiveSubscribers("t1");
    expect(subs.map((s) => s.archetype).sort()).toEqual(["personal", "shared"]);
  });

  it("teslim: personal→gate=1+facts, shared→facts ama gate yok", async () => {
    const store = seed();
    const monitoring = new InMemoryMonitoringRepository(store);
    const result = await runTopicCheck({ checker, monitoring }, topic);
    const sent: PushMessage[] = [];
    const notifier: Notifier = {
      async send(m) {
        sent.push(m);
        return { success: true };
      },
    };
    const devices = {
      async listTokens(uid: string) {
        return store.deviceTokens.filter((t) => t.userId === uid).map((t) => t.token);
      },
      async save() {},
    };
    await dispatchEventDeliveries(
      { monitoring, devices, notifier },
      {
        eventId: result.eventId ?? "",
        title: "Watcher",
        body: "x",
        facts: result.facts,
      },
    );
    const byToken = new Map(sent.map((m) => [m.token, m]));
    expect(byToken.get("tok-u2")?.data?.gate).toBe("1");
    expect(byToken.get("tok-u2")?.data?.facts).toContain("magnitude");
    expect(byToken.get("tok-u1")?.data?.gate).toBeUndefined();
    expect(byToken.get("tok-u1")?.data?.facts).toContain("magnitude");
    expect(byToken.get("tok-u2")?.data?.title).toBeTruthy();
  });
});
