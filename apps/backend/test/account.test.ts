import { describe, expect, it } from "vitest";
import { createWatcher } from "../src/application/create-watcher";
import { deleteAccount } from "../src/application/delete-account";
import { subscribeUser } from "../src/application/subscribe";
import { InMemoryAccountGateway } from "../src/infrastructure/in-memory/account.gateway";
import { InMemoryPriceRepository } from "../src/infrastructure/in-memory/price.repo";
import { InMemoryStore } from "../src/infrastructure/in-memory/store";
import { InMemorySubscriptionRepository } from "../src/infrastructure/in-memory/subscription.repo";
import { InMemoryCanonicalTopicRepository } from "../src/infrastructure/in-memory/topic.repo";
import { InMemoryWatchRepository } from "../src/infrastructure/in-memory/watch.repo";
import { InMemoryJobQueue } from "../src/infrastructure/queue/in-memory.queue";

describe("hesap silme (KVKK/GDPR)", () => {
  it("kullanıcının tüm verisini siler; başka kullanıcıyı korur", async () => {
    const store = new InMemoryStore();
    const d = {
      store,
      queue: new InMemoryJobQueue(),
      topics: new InMemoryCanonicalTopicRepository(store),
      watches: new InMemoryWatchRepository(store),
      subscriptions: new InMemorySubscriptionRepository(store),
      prices: new InMemoryPriceRepository(store),
    };
    await subscribeUser(d, "u", "pro", "month");
    await createWatcher(d, "u", { rawIntent: "benim konum", frequencyMinutes: 5 });
    store.deviceTokens.push({ userId: "u", token: "tok-u", platform: "android" });
    store.deliveries.push({
      id: "d1",
      eventId: "e1",
      userId: "u",
      watchId: "w1",
      channel: "push",
      status: "sent",
    });
    // korunması gereken başka kullanıcı
    await createWatcher(d, "v", { rawIntent: "diğer konu", frequencyMinutes: 60 });
    store.deviceTokens.push({ userId: "v", token: "tok-v", platform: "android" });

    await deleteAccount({ account: new InMemoryAccountGateway(store) }, "u");

    expect(store.watches.filter((w) => w.userId === "u").length).toBe(0);
    expect(store.deviceTokens.filter((t) => t.userId === "u").length).toBe(0);
    expect(store.deliveries.filter((x) => x.userId === "u").length).toBe(0);
    expect(store.subscriptions.has("u")).toBe(false);
    // diğer kullanıcı dokunulmadan kalır
    expect(store.watches.filter((w) => w.userId === "v").length).toBe(1);
    expect(store.deviceTokens.filter((t) => t.userId === "v").length).toBe(1);
  });

  it("idempotent: var olmayan kullanıcıda hata vermez", async () => {
    const store = new InMemoryStore();
    await deleteAccount({ account: new InMemoryAccountGateway(store) }, "yok");
    expect(store.watches.length).toBe(0);
  });
});
