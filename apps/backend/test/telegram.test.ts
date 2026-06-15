import { describe, expect, it } from "vitest";
import {
  InMemoryTelegramLinkStore,
  type TelegramReplier,
  handleTelegramUpdate,
} from "../src/application/telegram";
import {
  EMPTY_USER_CHANNELS,
  type UserChannelRepository,
  type UserChannels,
} from "../src/domain/channels";

function fakeReplier(): TelegramReplier & { sent: { chat: string; text: string }[] } {
  const sent: { chat: string; text: string }[] = [];
  return {
    sent,
    async sendText(chat, text) {
      sent.push({ chat, text });
      return true;
    },
  };
}

function fakeUserChannels(
  initial: Record<string, UserChannels> = {},
): UserChannelRepository & { store: Record<string, UserChannels> } {
  const store: Record<string, UserChannels> = { ...initial };
  return {
    store,
    async get(userId) {
      return store[userId] ?? EMPTY_USER_CHANNELS;
    },
    async set(userId, ch) {
      store[userId] = ch;
    },
  };
}

describe("InMemoryTelegramLinkStore (ADR-153)", () => {
  it("create→consume userId döner; ikinci consume null (tek-kullanımlık)", () => {
    const s = new InMemoryTelegramLinkStore();
    const code = s.create("u1");
    expect(s.consume(code)).toBe("u1");
    expect(s.consume(code)).toBeNull();
  });
  it("geçersiz kod → null", () => {
    expect(new InMemoryTelegramLinkStore().consume("yok")).toBeNull();
  });
  it("süresi geçen kod → null", () => {
    let now = 1000;
    const s = new InMemoryTelegramLinkStore(60_000, () => now);
    const code = s.create("u1");
    now += 61_000;
    expect(s.consume(code)).toBeNull();
  });
});

describe("handleTelegramUpdate (ADR-153)", () => {
  it("/start <geçerli kod> → hesabı bağlar + telegram'ı açar + 'bağlandı' yanıtı", async () => {
    const replier = fakeReplier();
    const links = new InMemoryTelegramLinkStore();
    const userChannels = fakeUserChannels({
      u1: { ...EMPTY_USER_CHANNELS, email: "a@b.com", enabled: ["email"] },
    });
    const code = links.create("u1");
    await handleTelegramUpdate(
      { replier, links, userChannels },
      { message: { chat: { id: 555 }, from: { language_code: "tr" }, text: `/start ${code}` } },
    );
    expect(userChannels.store.u1?.telegramChatId).toBe("555");
    expect(userChannels.store.u1?.enabled).toContain("telegram");
    expect(userChannels.store.u1?.enabled).toContain("email"); // mevcut tercih korunur
    expect(replier.sent[0]?.text).toContain("Bağlandı");
  });
  it("/start (kodsuz) → karşılama; hesap değişmez", async () => {
    const replier = fakeReplier();
    const userChannels = fakeUserChannels();
    await handleTelegramUpdate(
      { replier, links: new InMemoryTelegramLinkStore(), userChannels },
      { message: { chat: { id: 1 }, text: "/start" } },
    );
    expect(replier.sent[0]?.text).toContain("Whenly");
    expect(Object.keys(userChannels.store)).toHaveLength(0);
  });
  it("/start <geçersiz kod> → karşılama (bağlama yok)", async () => {
    const replier = fakeReplier();
    const userChannels = fakeUserChannels();
    await handleTelegramUpdate(
      { replier, links: new InMemoryTelegramLinkStore(), userChannels },
      { message: { chat: { id: 2 }, text: "/start deadbeef" } },
    );
    expect(replier.sent[0]?.text).toContain("Whenly");
    expect(Object.keys(userChannels.store)).toHaveLength(0);
  });
  it("rastgele metin → 'bildirim botuyum' açıklaması (en dil kodu)", async () => {
    const replier = fakeReplier();
    await handleTelegramUpdate(
      { replier, links: new InMemoryTelegramLinkStore(), userChannels: fakeUserChannels() },
      { message: { chat: { id: 9 }, from: { language_code: "en" }, text: "hello?" } },
    );
    expect(replier.sent[0]?.text.toLowerCase()).toContain("notification bot");
  });
  it("chat id yoksa sessiz (yanıt yok)", async () => {
    const replier = fakeReplier();
    await handleTelegramUpdate(
      { replier, links: new InMemoryTelegramLinkStore(), userChannels: fakeUserChannels() },
      {},
    );
    expect(replier.sent).toHaveLength(0);
  });
});
