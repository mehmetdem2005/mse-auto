import type { Announcement } from "@watcher/contracts";
import { describe, expect, it } from "vitest";
import { createContainer } from "../src/config/container";
import type { Env } from "../src/config/env";
import { createApp } from "../src/interfaces/http/app";

// ADR-100: Duyurular — admin CRUD + kullanıcı yalnız-yayınlanan görünümü.
function makeApp(): ReturnType<typeof createApp> {
  const env: Env = {
    NODE_ENV: "development",
    PORT: 3000,
    RATE_LIMIT_PER_MINUTE: 1000,
    WATCH_CREATE_PER_HOUR: 1000,
    ASSIST_PER_MINUTE: 1000,
    ADMIN_USER_IDS: "boss",
  };
  return createApp(createContainer(env));
}
const auth = (uid: string): Record<string, string> => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${uid}`,
});

describe("duyurular (ADR-100)", () => {
  it("admin olmayan oluşturamaz (403); kullanıcı listeyi görebilir", async () => {
    const app = makeApp();
    const forbidden = await app.request("/v1/admin/announcements", {
      method: "POST",
      headers: auth("user"),
      body: JSON.stringify({ title: "Merhaba", body: "deneme" }),
    });
    expect(forbidden.status).toBe(403);
    const list = await app.request("/v1/announcements", { headers: auth("user") });
    expect(list.status).toBe(200);
    expect((await list.json()) as Announcement[]).toEqual([]);
  });

  it("admin oluşturur; yalnız yayınlananlar kullanıcıya gider; sabit önce sıralanır", async () => {
    const app = makeApp();
    // Taslak (published=false) — kullanıcı görmemeli
    await app.request("/v1/admin/announcements", {
      method: "POST",
      headers: auth("boss"),
      body: JSON.stringify({ title: "Taslak", body: "gizli", published: false }),
    });
    // Yayınlanan normal
    await app.request("/v1/admin/announcements", {
      method: "POST",
      headers: auth("boss"),
      body: JSON.stringify({ title: "Yeni özellik", body: "Google girişi geldi", kind: "update" }),
    });
    // Yayınlanan + sabit (pinned) — listede önce
    const pinned = await app.request("/v1/admin/announcements", {
      method: "POST",
      headers: auth("boss"),
      body: JSON.stringify({ title: "Önemli", body: "bakım", kind: "warning", pinned: true }),
    });
    expect(pinned.status).toBe(200);

    const adminList = (await (
      await app.request("/v1/admin/announcements", { headers: auth("boss") })
    ).json()) as Announcement[];
    expect(adminList.length).toBe(3); // taslak dahil

    const userList = (await (
      await app.request("/v1/announcements", { headers: auth("user") })
    ).json()) as Announcement[];
    expect(userList.length).toBe(2); // taslak hariç
    expect(userList[0].title).toBe("Önemli"); // sabit önce
    expect(userList.every((a) => a.published)).toBe(true);
  });

  it("javascript: gibi tehlikeli CTA/görsel URL'i reddedilir (400)", async () => {
    const app = makeApp();
    const res = await app.request("/v1/admin/announcements", {
      method: "POST",
      headers: auth("boss"),
      body: JSON.stringify({ title: "Kötü", body: "deneme", ctaUrl: "javascript:alert(1)" }),
    });
    expect(res.status).toBe(400);
  });

  it("PATCH ile yayından kaldırma + DELETE çalışır", async () => {
    const app = makeApp();
    const created = (await (
      await app.request("/v1/admin/announcements", {
        method: "POST",
        headers: auth("boss"),
        body: JSON.stringify({ title: "Geçici", body: "deneme" }),
      })
    ).json()) as Announcement;
    // yayından kaldır
    const patched = await app.request(`/v1/admin/announcements/${created.id}`, {
      method: "PATCH",
      headers: auth("boss"),
      body: JSON.stringify({ published: false }),
    });
    expect(patched.status).toBe(200);
    expect(((await patched.json()) as Announcement).published).toBe(false);
    // kullanıcı artık görmemeli
    const userList = (await (
      await app.request("/v1/announcements", { headers: auth("user") })
    ).json()) as Announcement[];
    expect(userList.find((a) => a.id === created.id)).toBeUndefined();
    // sil
    const del = await app.request(`/v1/admin/announcements/${created.id}`, {
      method: "DELETE",
      headers: auth("boss"),
    });
    expect(del.status).toBe(200);
  });

  it("ADR-134: pro hediyesi alıcının zilinde KİŞİYE-ÖZEL duyuru açar; başkası görmez; recipientUserId sızmaz", async () => {
    const app = makeApp();
    const gift = await app.request("/v1/admin/users/alice/gift-pro", {
      method: "POST",
      headers: auth("boss"),
      body: JSON.stringify({ interval: "month" }),
    });
    expect(gift.status).toBe(200);

    const aliceList = (await (
      await app.request("/v1/announcements", { headers: auth("alice") })
    ).json()) as Announcement[];
    expect(aliceList.some((a) => a.title === "Pro aboneliğin hazır")).toBe(true);
    // Gizlilik: hedef alanı istemciye sızmaz.
    expect(aliceList.every((a) => !("recipientUserId" in a))).toBe(true);

    // Başka kullanıcı kişiye-özel hediyeyi GÖRMEZ.
    const bobList = (await (
      await app.request("/v1/announcements", { headers: auth("bob") })
    ).json()) as Announcement[];
    expect(bobList.some((a) => a.title === "Pro aboneliğin hazır")).toBe(false);
  });
});
