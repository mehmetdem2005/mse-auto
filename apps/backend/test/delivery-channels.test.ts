import { describe, expect, it } from "vitest";
import { dispatchEventDeliveries } from "../src/application/delivery";
import {
  type ChannelKind,
  type ChannelMessage,
  type ChannelSender,
  EMPTY_USER_CHANNELS,
  type UserChannelRepository,
  type UserChannels,
} from "../src/domain/channels";
import type { DeviceRepository } from "../src/domain/device";
import type { DeliveryStatus, PendingDelivery } from "../src/domain/monitoring";
import type { Notifier } from "../src/domain/notifier";
import type { WatchArchetype } from "../src/domain/watch";

function recordingSender(kind: ChannelKind): ChannelSender & { sent: string[] } {
  const sent: string[] = [];
  return {
    kind,
    sent,
    async send(target: string, _msg: ChannelMessage) {
      sent.push(target);
      return { success: true };
    },
  };
}

function deps(opts: {
  archetype: WatchArchetype;
  channels: ChannelSender[];
  prefs: UserChannels;
  tokens?: string[];
}) {
  const statuses: Record<string, DeliveryStatus> = {};
  const pending: PendingDelivery[] = [
    { id: "d1", userId: "u1", watchId: "w1", archetype: opts.archetype },
  ];
  const monitoring = {
    async listPendingDeliveriesForEvent() {
      return pending;
    },
    async markDeliveryStatus(id: string, s: DeliveryStatus) {
      statuses[id] = s;
    },
  } as unknown as import("../src/domain/monitoring").MonitoringRepository;
  const devices: DeviceRepository = {
    async save() {},
    async listTokens() {
      return opts.tokens ?? ["tok"];
    },
  };
  const pushSent: string[] = [];
  const notifier: Notifier = {
    async send(m) {
      pushSent.push(m.token);
      return { success: true };
    },
  };
  const userChannels: UserChannelRepository = {
    async get() {
      return opts.prefs;
    },
    async set() {},
  };
  return {
    monitoring,
    devices,
    notifier,
    userChannels,
    channels: opts.channels,
    statuses,
    pushSent,
  };
}

const job = { eventId: "e1", title: "T", body: "B" };

describe("çok-kanallı teslim (ADR-084)", () => {
  it("paylaşılan teslimde açık + hedefi dolu kanallara gönderir", async () => {
    const tg = recordingSender("telegram");
    const email = recordingSender("email");
    const wa = recordingSender("whatsapp");
    const prefs: UserChannels = {
      telegramChatId: "123",
      email: "a@b.com",
      whatsappTo: null, // hedef yok → gönderilmez
      enabled: ["telegram", "email", "whatsapp"],
    };
    const d = deps({ archetype: "shared", channels: [tg, email, wa], prefs });
    await dispatchEventDeliveries(d, job);
    expect(tg.sent).toEqual(["123"]);
    expect(email.sent).toEqual(["a@b.com"]);
    expect(wa.sent).toEqual([]); // hedef boş
    expect(d.statuses.d1).toBe("sent");
  });

  it("kapalı kanala göndermez (enabled içinde yoksa)", async () => {
    const tg = recordingSender("telegram");
    const prefs: UserChannels = {
      telegramChatId: "123",
      email: null,
      whatsappTo: null,
      enabled: [], // hiçbiri açık değil
    };
    const d = deps({ archetype: "shared", channels: [tg], prefs });
    await dispatchEventDeliveries(d, job);
    expect(tg.sent).toEqual([]);
  });

  it("KİŞİSEL (personal) teslimde ek kanal ATLANIR — cihaz-gate gizliliği (P1)", async () => {
    const tg = recordingSender("telegram");
    const prefs: UserChannels = {
      telegramChatId: "123",
      email: null,
      whatsappTo: null,
      enabled: ["telegram"],
    };
    const d = deps({ archetype: "personal", channels: [tg], prefs });
    await dispatchEventDeliveries(d, job);
    expect(tg.sent).toEqual([]); // sunucu kişisel kriteri bilmez → sızdırmaz
    expect(d.pushSent).toEqual(["tok"]); // push yine de gider (cihaz gate'ler)
  });

  it("ek kanal bağımlılığı yoksa yalnız push (geri-uyumlu)", async () => {
    const d = {
      ...deps({ archetype: "shared", channels: [], prefs: EMPTY_USER_CHANNELS }),
    };
    const dNoCh = {
      monitoring: d.monitoring,
      devices: d.devices,
      notifier: d.notifier,
    };
    const out = await dispatchEventDeliveries(dNoCh, job);
    expect(out.sent).toBe(1);
  });
});
