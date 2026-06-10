import { describe, expect, it } from "vitest";
import { createWatcher } from "../src/application/create-watcher";
import { subscribeUser } from "../src/application/subscribe";
import { PlanLimitError } from "../src/domain/errors";
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

async function expectPlanError(fn: () => Promise<unknown>, code: string): Promise<void> {
  try {
    await fn();
    throw new Error("hata bekleniyordu");
  } catch (e) {
    expect(e).toBeInstanceOf(PlanLimitError);
    expect((e as PlanLimitError).code).toBe(code);
  }
}

describe("plan limitleri (free vs pro)", () => {
  it("free: 3 watcher'a kadar; 4. reddedilir (watch_limit)", async () => {
    const d = deps();
    for (const t of ["a konu", "b konu", "c konu"]) {
      await createWatcher(d, "u", { rawIntent: t, frequencyMinutes: 60 });
    }
    await expectPlanError(
      () => createWatcher(d, "u", { rawIntent: "d konu", frequencyMinutes: 60 }),
      "watch_limit",
    );
  });

  it("free: 60 dk altı sıklık reddedilir (frequency_limit)", async () => {
    const d = deps();
    await expectPlanError(
      () => createWatcher(d, "u", { rawIntent: "hızlı", frequencyMinutes: 30 }),
      "frequency_limit",
    );
  });

  it("pro: limit 100 ve 1 dk açılır", async () => {
    const d = deps();
    await subscribeUser(d, "u", "pro", "month");
    for (const t of ["a", "b", "c", "d"]) {
      await createWatcher(d, "u", { rawIntent: `${t} konu`, frequencyMinutes: 1 });
    }
    const count = d.store.watches.filter((w) => w.userId === "u").length;
    expect(count).toBe(4);
  });
});
