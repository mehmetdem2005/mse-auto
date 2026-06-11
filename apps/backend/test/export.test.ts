import { describe, expect, it } from "vitest";
import { createWatcher } from "../src/application/create-watcher";
import { exportAccount } from "../src/application/export-account";
import { subscribeUser } from "../src/application/subscribe";
import { InMemoryMonitoringRepository } from "../src/infrastructure/in-memory/monitoring.repo";
import { InMemoryPriceRepository } from "../src/infrastructure/in-memory/price.repo";
import { InMemoryStore } from "../src/infrastructure/in-memory/store";
import { InMemorySubscriptionRepository } from "../src/infrastructure/in-memory/subscription.repo";
import { InMemorySupportRepository } from "../src/infrastructure/in-memory/support.repo";
import { InMemoryCanonicalTopicRepository } from "../src/infrastructure/in-memory/topic.repo";
import { InMemoryWatchRepository } from "../src/infrastructure/in-memory/watch.repo";
import { InMemoryJobQueue } from "../src/infrastructure/queue/in-memory.queue";

describe("hesap veri dökümü (KVKK m.11 / GDPR Art.15+20)", () => {
  it("kullanıcının tüm PII-zon verisini döker; başka kullanıcıyı sızdırmaz", async () => {
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
    const support = new InMemorySupportRepository(store);
    await support.createTicket("u", "problem", "ilk mesaj");
    // korunması gereken başka kullanıcı — dökümde GÖRÜNMEMELİ
    await createWatcher(d, "v", { rawIntent: "diğer konu", frequencyMinutes: 60 });

    const exp = await exportAccount(
      {
        watches: d.watches,
        subscriptions: d.subscriptions,
        support,
        monitoring: new InMemoryMonitoringRepository(store),
      },
      "u",
      "u@example.com",
    );

    expect(exp.format).toBe("whenly-account-export");
    expect(exp.account).toEqual({ userId: "u", email: "u@example.com" });
    expect(exp.watches).toHaveLength(1);
    expect(exp.watches[0]?.rawIntent).toBe("benim konum");
    expect(exp.watches.every((w) => w.userId === "u")).toBe(true);
    expect(exp.subscription).not.toBeNull();
    expect(exp.supportTickets).toHaveLength(1);
    expect(exp.supportTickets[0]?.messages[0]?.body).toBe("ilk mesaj");
    expect(Array.isArray(exp.notifications)).toBe(true);
  });
});
