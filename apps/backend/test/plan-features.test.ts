import { describe, expect, it } from "vitest";
import { createContainer } from "../src/config/container";
import type { Env } from "../src/config/env";
import { createApp } from "../src/interfaces/http/app";

// ADR-139: plan özellik-maddeleri (admin-yazılı, dile-özel; app_settings). Public okuma + admin yazma.
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
type Feat = { free: string[]; pro: string[] };

describe("plan özellik-maddeleri (ADR-139)", () => {
  it("admin olmayan → 403 (yazma uçları korunur)", async () => {
    const res = await makeApp().request("/v1/admin/plan-features?lang=tr", {
      headers: auth("user"),
    });
    expect(res.status).toBe(403);
  });

  it("public GET varsayılan: admin yazmadan boş diziler (istemci i18n varsayılanına düşer)", async () => {
    const res = await makeApp().request("/v1/plans/features?lang=tr", { headers: auth("user") });
    expect(res.status).toBe(200);
    const b = (await res.json()) as Feat;
    expect(b).toEqual({ free: [], pro: [] });
  });

  it("admin PUT yansır + DİL İZOLASYONU (tr yazımı en'i etkilemez)", async () => {
    const app = makeApp();
    const put = await app.request("/v1/admin/plan-features", {
      method: "PUT",
      headers: jsonAuth("boss"),
      body: JSON.stringify({ plan: "pro", lang: "tr", bullets: ["100 izleme", "Alarm uyarı"] }),
    });
    expect(put.status).toBe(200);
    expect((await put.json()) as Feat).toEqual({ free: [], pro: ["100 izleme", "Alarm uyarı"] });

    // Public okuma tr → pro maddeleri görünür
    const tr = await app.request("/v1/plans/features?lang=tr", { headers: auth("user") });
    expect((await tr.json()) as Feat).toEqual({ free: [], pro: ["100 izleme", "Alarm uyarı"] });

    // Başka dil (en) ETKİLENMEZ → hâlâ boş (istemci varsayılana düşer)
    const en = await app.request("/v1/plans/features?lang=en", { headers: auth("user") });
    expect((await en.json()) as Feat).toEqual({ free: [], pro: [] });
  });

  it("boş/whitespace madde şema ile reddedilir (min 1 karakter, trim)", async () => {
    const res = await makeApp().request("/v1/admin/plan-features", {
      method: "PUT",
      headers: jsonAuth("boss"),
      body: JSON.stringify({ plan: "free", lang: "tr", bullets: ["   "] }),
    });
    expect(res.status).toBe(400);
  });
});
