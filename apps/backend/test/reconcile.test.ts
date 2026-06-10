import { describe, expect, it } from "vitest";
import { createWatcher } from "../src/application/create-watcher";
import { reconcilePlan } from "../src/application/reconcile-plan";
import { subscribeUser } from "../src/application/subscribe";
import type { Subscription } from "../src/domain/billing";
import { InMemoryPriceRepository } from "../src/infrastructure/in-memory/price.repo";
import { InMemoryStore } from "../src/infrastructure/in-memory/store";
import { InMemorySubscriptionRepository } from "../src/infrastructure/in-memory/subscription.repo";
import { InMemoryCanonicalTopicRepository } from "../src/infrastructure/in-memory/topic.repo";
import { InMemoryWatchRepository } from "../src/infrastructure/in-memory/watch.repo";
import { InMemoryJobQueue } from "../src/infrastructure/queue/in-memory.queue";

function deps() {
  const store = new InMemoryStore();
  return {
    store,
    queue: new InMemoryJobQueue(),
    topics: new InMemoryCanonicalTopicRepository(store),
    watches: new InMemoryWatchRepository(store),
    subscriptions: new InMemorySubscriptionRepository(store),
    prices: new InMemoryPriceRepository(store),
  };
}

async function expire(d: ReturnType<typeof deps>): Promise<void> {
  const sub = (await d.subscriptions.getByUser("u")) as Subscription;
  await d.subscriptions.save({
    ...sub,
    currentPeriodEnd: new Date(Date.now() - 1000).toISOString(),
  });
}

describe("plan uzlaştırma (downgrade/upgrade)", () => {
  it("downgrade: en yeni 3 aktif kalır, 2 duraklar, sıklık 60'a yükselir", async () => {
    const d = deps();
    await subscribeUser(d, "u", "pro", "month");
    for (const t of ["a", "b", "c", "d", "e"]) {
      await createWatcher(d, "u", { rawIntent: `${t} konu`, frequencyMinutes: 5 });
    }
    await expire(d);

    const res = await reconcilePlan(d, "u");
    const mine = d.store.watches.filter((w) => w.userId === "u");
    const active = mine.filter((w) => w.status === "active");
    expect(active.length).toBe(3);
    expect(res.paused.length).toBe(2);
    expect(active.every((w) => w.frequencyMinutes >= 60)).toBe(true);
    expect(res.bumped.length).toBe(3);
  });

  it("upgrade-resume: pro'ya dönünce duraklatılanlar yeniden aktifleşir", async () => {
    const d = deps();
    await subscribeUser(d, "u", "pro", "month");
    for (const t of ["a", "b", "c", "d", "e"]) {
      await createWatcher(d, "u", { rawIntent: `${t} konu`, frequencyMinutes: 5 });
    }
    await expire(d);
    await reconcilePlan(d, "u");

    await subscribeUser(d, "u", "pro", "month");
    const res = await reconcilePlan(d, "u");
    const active = d.store.watches.filter((w) => w.userId === "u" && w.status === "active");
    expect(active.length).toBe(5);
    expect(res.resumed.length).toBe(2);
  });

  it("idempotent: ikinci çağrı hiç yazmaz", async () => {
    const d = deps();
    await subscribeUser(d, "u", "pro", "month");
    await createWatcher(d, "u", { rawIntent: "tek konu", frequencyMinutes: 5 });
    await reconcilePlan(d, "u");
    const r2 = await reconcilePlan(d, "u");
    expect(r2.paused.length + r2.resumed.length + r2.bumped.length).toBe(0);
  });
});
