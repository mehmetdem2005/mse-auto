import { beforeEach, describe, expect, it } from "vitest";
import { cancelSubscription } from "../src/application/cancel";
import { renewSubscription } from "../src/application/renew";
import { setPlanPrice } from "../src/application/set-price";
import { subscribeUser } from "../src/application/subscribe";
import { effectivePlan } from "../src/domain/billing";
import { InMemoryPriceRepository } from "../src/infrastructure/in-memory/price.repo";
import { InMemoryStore } from "../src/infrastructure/in-memory/store";
import { InMemorySubscriptionRepository } from "../src/infrastructure/in-memory/subscription.repo";

function ctx() {
  const store = new InMemoryStore();
  return {
    store,
    prices: new InMemoryPriceRepository(store),
    subscriptions: new InMemorySubscriptionRepository(store),
  };
}

describe("standartlara uygun abonelik + grandfathering", () => {
  let c: ReturnType<typeof ctx>;
  beforeEach(() => {
    c = ctx();
  });

  it("satın alımda güncel fiyatı snapshot'lar", async () => {
    const s = await subscribeUser(c, "uW", "pro", "month");
    expect(s.amountCents).toBe(499);
    expect(s.status).toBe("active");
  });

  it("fiyat değişimi mevcut aktif aboneyi dönem boyunca etkilemez", async () => {
    await subscribeUser(c, "uW", "pro", "month");
    await setPlanPrice(c, "pro", "month", 1999, "usd");
    const after = await c.subscriptions.getByUser("uW");
    expect(after?.amountCents).toBe(499); // grandfathered
    expect(effectivePlan(after, new Date())).toBe("pro");
  });

  it("yeni abone güncel fiyatı alır", async () => {
    await setPlanPrice(c, "pro", "month", 1999, "usd");
    const s = await subscribeUser(c, "uNew", "pro", "month");
    expect(s.amountCents).toBe(1999);
  });

  it("yenilemede güncel fiyat uygulanır (grandfathering dönem sonunda biter)", async () => {
    const past = new Date(Date.now() - 40 * 24 * 3600 * 1000);
    await subscribeUser(c, "uPast", "pro", "month", past);
    await setPlanPrice(c, "pro", "month", 1999, "usd");
    const result = await renewSubscription(c, "uPast");
    const after = await c.subscriptions.getByUser("uPast");
    expect(result).toBe("renewed");
    expect(after?.amountCents).toBe(1999);
    expect(new Date(after?.currentPeriodEnd ?? 0).getTime()).toBeGreaterThan(Date.now());
  });

  it("iptal: dönem sonuna dek aktif, dönem bitince canceled", async () => {
    const past = new Date(Date.now() - 40 * 24 * 3600 * 1000);
    await subscribeUser(c, "uCancel", "pro", "month", past);
    await cancelSubscription(c, "uCancel");
    const flagged = await c.subscriptions.getByUser("uCancel");
    expect(flagged?.cancelAtPeriodEnd).toBe(true);
    expect(await renewSubscription(c, "uCancel")).toBe("canceled");
  });
});
