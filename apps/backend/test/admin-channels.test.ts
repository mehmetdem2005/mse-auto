import { describe, expect, it } from "vitest";
import { type DeliveryDeps, dispatchEventDeliveries } from "../src/application/delivery";
import { createContainer } from "../src/config/container";
import type { Env } from "../src/config/env";
import type {
  ChannelKind,
  ChannelMessage,
  ChannelSender,
  UserChannels,
} from "../src/domain/channels";
import type { DeviceRepository } from "../src/domain/device";
import type { DeliveryStatus, PendingDelivery } from "../src/domain/monitoring";
import type { Notifier } from "../src/domain/notifier";
import { createApp } from "../src/interfaces/http/app";

// ADR-107: admin kanal aç/kapa — yetki + sözleşme + TESLİM uygulaması (kapalı kanal atlanır).
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
const auth = (uid: string): Record<string, string> => ({ Authorization: `Bearer ${uid}` });
const jsonAuth = (uid: string): Record<string, string> => ({
  ...auth(uid),
  "Content-Type": "application/json",
});

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

describe("admin kanal aç/kapa (ADR-107)", () => {
  it("config: admin olmayan → 403", async () => {
    const res = await makeApp().request("/v1/admin/channel-config", { headers: auth("user") });
    expect(res.status).toBe(403);
  });

  it("GET varsayılan hepsi açık; PUT kapatınca GET + /v1/config yansır", async () => {
    const app = makeApp();
    const g = await app.request("/v1/admin/channel-config", { headers: auth("boss") });
    expect(g.status).toBe(200);
    // ADR-152: availability (admin tercihi) + configured (sunucuda kimlik bilgisi; test env'de yok).
    expect(await g.json()).toEqual({
      availability: { telegram: true, whatsapp: true, email: true },
      configured: { telegram: false, whatsapp: false, email: false },
    });

    const p = await app.request("/v1/admin/channel-config", {
      method: "PUT",
      headers: jsonAuth("boss"),
      body: JSON.stringify({ telegram: true, whatsapp: false, email: true }),
    });
    expect(p.status).toBe(200);

    const g2 = (await (
      await app.request("/v1/admin/channel-config", { headers: auth("boss") })
    ).json()) as { availability: { whatsapp: boolean } };
    expect(g2.availability.whatsapp).toBe(false);

    // /v1/config: channels = ETKİN (admin AND configured). Kimlik bilgisi yok → dürüstçe false.
    const cfg = (await (await app.request("/v1/config", { headers: auth("boss") })).json()) as {
      channels: { whatsapp: boolean };
      channelsConfigured: { whatsapp: boolean };
    };
    expect(cfg.channelsConfigured.whatsapp).toBe(false);
    expect(cfg.channels.whatsapp).toBe(false);
  });

  it("teslimde admin-KAPALI kanal atlanır, açık kanal gönderir", async () => {
    const tg = recordingSender("telegram");
    const wa = recordingSender("whatsapp");
    const prefs: UserChannels = {
      telegramChatId: "123",
      email: null,
      whatsappTo: "+90555",
      enabled: ["telegram", "whatsapp"],
    };
    const statuses: Record<string, DeliveryStatus> = {};
    const pending: PendingDelivery[] = [
      { id: "d1", userId: "u1", watchId: "w1", archetype: "shared" },
    ];
    const deps: DeliveryDeps = {
      monitoring: {
        async listPendingDeliveriesForEvent() {
          return pending;
        },
        async markDeliveryStatus(id: string, s: DeliveryStatus) {
          statuses[id] = s;
        },
      } as unknown as import("../src/domain/monitoring").MonitoringRepository,
      devices: {
        async save() {},
        async listTokens() {
          return ["tok"]; // ek kanal bloğuna ulaşmak için en az 1 push token şart
        },
      } as DeviceRepository,
      notifier: {
        async send() {
          return { success: true };
        },
      } as Notifier,
      channels: [tg, wa],
      userChannels: {
        async get() {
          return prefs;
        },
        async set() {},
      },
      // Admin whatsapp'ı kapattı → yalnız telegram açık.
      enabledChannels: async () => new Set<ChannelKind>(["telegram"]),
    };
    await dispatchEventDeliveries(deps, { eventId: "e1", title: "T", body: "B" });
    expect(tg.sent).toEqual(["123"]); // açık → gitti
    expect(wa.sent).toEqual([]); // admin kapattı → atlandı
  });
});
