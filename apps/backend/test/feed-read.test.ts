import { describe, expect, it } from "vitest";
import { InMemoryMonitoringRepository } from "../src/infrastructure/in-memory/monitoring.repo";
import { InMemoryStore } from "../src/infrastructure/in-memory/store";

/** Feed "okundu" durumu (0005 read_at) — in-memory davranış. */
describe("feed read-state (read_at)", () => {
  function setup() {
    const store = new InMemoryStore();
    const repo = new InMemoryMonitoringRepository(store);
    store.deliveries.push(
      {
        id: "d1",
        eventId: "e1",
        userId: "u1",
        watchId: "w1",
        channel: "push",
        status: "sent",
        readAt: null,
      },
      {
        id: "d2",
        eventId: "e2",
        userId: "u1",
        watchId: "w1",
        channel: "push",
        status: "sent",
        readAt: null,
      },
      {
        id: "d3",
        eventId: "e3",
        userId: "u2",
        watchId: "w9",
        channel: "push",
        status: "sent",
        readAt: null,
      },
    );
    return { store, repo };
  }

  it("listFeed yeni teslimleri okunmamış (readAt=null) gösterir", async () => {
    const { repo } = setup();
    const feed = await repo.listFeed("u1", 50);
    expect(feed).toHaveLength(2);
    expect(feed.every((f) => f.readAt === null)).toBe(true);
  });

  it("markDeliveryRead yalnız sahibinin tek satırını damgalar", async () => {
    const { repo } = setup();
    await repo.markDeliveryRead("u1", "d1");
    const feed = await repo.listFeed("u1", 50);
    expect(feed.find((f) => f.deliveryId === "d1")?.readAt).not.toBeNull();
    expect(feed.find((f) => f.deliveryId === "d2")?.readAt).toBeNull();
    // başka kullanıcının satırına dokunamaz
    await repo.markDeliveryRead("u1", "d3");
    const other = await repo.listFeed("u2", 50);
    expect(other[0]?.readAt).toBeNull();
  });

  it("markAllRead yalnız okunmamışları sayar ve okundu yapar", async () => {
    const { repo } = setup();
    await repo.markDeliveryRead("u1", "d1"); // 1 okundu
    const n = await repo.markAllRead("u1");
    expect(n).toBe(1); // yalnız d2 kalmıştı
    const feed = await repo.listFeed("u1", 50);
    expect(feed.every((f) => f.readAt !== null)).toBe(true);
    // idempotent: tekrar çağır → 0
    expect(await repo.markAllRead("u1")).toBe(0);
  });
});
