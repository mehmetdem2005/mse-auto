import { describe, expect, it } from "vitest";
import {
  getEntitlements,
  getPlanEntitlements,
  setPlanEntitlements,
} from "../src/application/plan-config";
import { InMemorySettingsRepository } from "../src/infrastructure/in-memory/settings.repo";

// ADR-160: admin-yapılandırılır plan yetkileri (app_settings override + güvenli defaults/clamp).
describe("plan-config (ADR-160)", () => {
  it("ayar yokken statik varsayılanları döner (free=3/60, pro=100/1)", async () => {
    const s = new InMemorySettingsRepository();
    const ent = await getPlanEntitlements(s);
    expect(ent.free.maxActiveWatches).toBe(3);
    expect(ent.free.minFrequencyMinutes).toBe(60);
    expect(ent.pro.maxActiveWatches).toBe(100);
    expect(ent.pro.alarmChannel).toBe(true);
  });

  it("admin override kalıcı + okunur (pro 100→200)", async () => {
    const s = new InMemorySettingsRepository();
    await setPlanEntitlements(s, "pro", {
      maxActiveWatches: 200,
      minFrequencyMinutes: 1,
      alarmChannel: true,
      allSounds: true,
    });
    expect((await getEntitlements(s, "pro")).maxActiveWatches).toBe(200);
    // free dokunulmadı → varsayılan korunur (izolasyon)
    expect((await getEntitlements(s, "free")).maxActiveWatches).toBe(3);
  });

  it("free'ye alarm/sesler açılabilir (özellik değişikliği)", async () => {
    const s = new InMemorySettingsRepository();
    await setPlanEntitlements(s, "free", {
      maxActiveWatches: 5,
      minFrequencyMinutes: 30,
      alarmChannel: true,
      allSounds: false,
    });
    const free = await getEntitlements(s, "free");
    expect(free).toEqual({
      maxActiveWatches: 5,
      minFrequencyMinutes: 30,
      alarmChannel: true,
      allSounds: false,
    });
  });

  it("bozuk/geçersiz saklı değer → güvenli varsayılana clamp (sistem düşmez)", async () => {
    const s = new InMemorySettingsRepository();
    // doğrudan bozuk değer yaz (admin paneli zod ile korur ama depo bozulabilir)
    await s.set("plan.entitlements", { pro: { maxActiveWatches: -5, minFrequencyMinutes: 0 } });
    const pro = await getEntitlements(s, "pro");
    expect(pro.maxActiveWatches).toBe(100); // -5 geçersiz → varsayılan
    expect(pro.minFrequencyMinutes).toBe(1); // 0 < 1 → varsayılan
    expect(pro.alarmChannel).toBe(true); // eksik alan → varsayılan
  });
});
