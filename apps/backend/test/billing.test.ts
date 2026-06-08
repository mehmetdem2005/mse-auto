import { describe, expect, it } from "vitest";
import { handlePaymentWebhook, startCheckout } from "../src/application/billing";
import { createWatcher } from "../src/application/create-watcher";
import { getSubscription } from "../src/application/get-subscription";
import { InMemoryPaymentGateway } from "../src/infrastructure/in-memory/payment.gateway";
import { InMemoryPriceRepository } from "../src/infrastructure/in-memory/price.repo";
import { InMemoryStore } from "../src/infrastructure/in-memory/store";
import { InMemorySubscriptionRepository } from "../src/infrastructure/in-memory/subscription.repo";
import { InMemoryCanonicalTopicRepository } from "../src/infrastructure/in-memory/topic.repo";
import { InMemoryWatchRepository } from "../src/infrastructure/in-memory/watch.repo";

function deps() {
  const store = new InMemoryStore();
  return {
    payment: new InMemoryPaymentGateway("http://localhost:3000"),
    prices: new InMemoryPriceRepository(store),
    subscriptions: new InMemorySubscriptionRepository(store),
    watches: new InMemoryWatchRepository(store),
    topics: new InMemoryCanonicalTopicRepository(store),
  };
}
const active = JSON.stringify({
  type: "subscription_active",
  userId: "u",
  interval: "month",
  periodStart: new Date().toISOString(),
});

describe("Stripe ödeme (in-memory gateway)", () => {
  it("checkout URL döndürür", async () => {
    const { url } = await startCheckout(deps(), "u", "month", null);
    expect(url).toContain("interval=month");
  });

  it("webhook aktif → kullanıcı pro olur (entitlements açık)", async () => {
    const d = deps();
    await handlePaymentWebhook(d, active, "sig");
    const sub = await getSubscription(d, "u");
    expect(sub.plan).toBe("pro");
    expect(sub.entitlements.alarmChannel).toBe(true);
  });

  it("webhook iptal → free'ye döner + fazla watch duraklatılır (reconcile)", async () => {
    const d = deps();
    await handlePaymentWebhook(d, active, "sig");
    for (let i = 0; i < 4; i++) {
      await createWatcher(d, "u", { rawIntent: `konu ${i}`, frequencyMinutes: 5 });
    }
    expect((await getSubscription(d, "u")).usage.activeWatches).toBe(4);
    await handlePaymentWebhook(
      d,
      JSON.stringify({ type: "subscription_canceled", userId: "u" }),
      "sig",
    );
    const after = await getSubscription(d, "u");
    expect(after.plan).toBe("free");
    expect(after.usage.activeWatches).toBe(3);
  });
});
