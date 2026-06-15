import { describe, expect, it, vi } from "vitest";
import { searchAdmin } from "../src/application/admin-search";
import type { AdminConsoleRepository } from "../src/domain/billing";

// ADR-149 — admin global arama: e-posta/niyet/id eşleşmesi; <2 karakter → boş (liste çekmez).
function makeRepo() {
  const adminConsole = {
    listUsers: vi.fn(async () => [
      {
        id: "u1",
        email: "ada@example.com",
        createdAt: "",
        isAdmin: false,
        plan: "free",
        watchCount: 2,
      },
      {
        id: "u2",
        email: "bob@other.com",
        createdAt: "",
        isAdmin: false,
        plan: "pro",
        watchCount: 9,
      },
    ]),
    listWatches: vi.fn(async () => [
      {
        id: "w1",
        userId: "u1",
        userEmail: "ada@example.com",
        rawIntent: "deprem olunca haber ver",
        archetype: "shared",
        frequencyMinutes: 60,
        status: "active",
        createdAt: "",
      },
    ]),
    listSubscriptions: vi.fn(async () => [
      {
        userId: "u2",
        userEmail: "bob@other.com",
        plan: "pro",
        interval: "month",
        amountCents: 500,
        currency: "usd",
        status: "active",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      },
    ]),
  };
  return adminConsole as unknown as AdminConsoleRepository & typeof adminConsole;
}

describe("admin global arama (ADR-149)", () => {
  it("<2 karakter → boş + liste çekilmez", async () => {
    const repo = makeRepo();
    expect(await searchAdmin({ adminConsole: repo }, "a")).toEqual({
      users: [],
      watches: [],
      subscriptions: [],
    });
    expect(repo.listUsers).not.toHaveBeenCalled();
  });

  it("niyet eşleşmesi → yalnız watcher", async () => {
    const r = await searchAdmin({ adminConsole: makeRepo() }, "deprem");
    expect(r.watches).toHaveLength(1);
    expect(r.users).toHaveLength(0);
    expect(r.subscriptions).toHaveLength(0);
  });

  it("e-posta eşleşmesi → ilgili kategorilerde (ada → kullanıcı + watcher)", async () => {
    const r = await searchAdmin({ adminConsole: makeRepo() }, "ada@");
    expect(r.users.map((u) => u.id)).toEqual(["u1"]);
    expect(r.watches).toHaveLength(1);
    expect(r.subscriptions).toHaveLength(0); // ada'nın aboneliği yok (u2 bob)
  });

  it("id eşleşmesi → kullanıcı + abonelik (u2)", async () => {
    const r = await searchAdmin({ adminConsole: makeRepo() }, "u2");
    expect(r.users.map((u) => u.id)).toEqual(["u2"]);
    expect(r.subscriptions.map((s) => s.userId)).toEqual(["u2"]);
  });
});
