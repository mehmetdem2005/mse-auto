import { describe, expect, it } from "vitest";
import { createContainer } from "../src/config/container";
import type { Env } from "../src/config/env";
import { SwitchableEmailComposer } from "../src/infrastructure/llm/switchable";
import { createApp } from "../src/interfaces/http/app";

// ADR-109: e-posta besteci istemi (admin) + composer DAYANIKLILIK (LLM yoksa ham metin).
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

describe("admin e-posta istemi (ADR-109)", () => {
  it("admin olmayan → 403", async () => {
    const res = await makeApp().request("/v1/admin/email-prompt", { headers: auth("user") });
    expect(res.status).toBe(403);
  });

  it("GET varsayılan: useDefault true, prompt===defaultPrompt (boş değil)", async () => {
    const res = await makeApp().request("/v1/admin/email-prompt", { headers: auth("boss") });
    expect(res.status).toBe(200);
    const b = (await res.json()) as {
      useDefault: boolean;
      prompt: string;
      defaultPrompt: string;
    };
    expect(b.useDefault).toBe(true);
    expect(b.defaultPrompt.length).toBeGreaterThan(50);
    expect(b.prompt).toBe(b.defaultPrompt);
  });

  it("PUT özel istem yansır; varsayılana dönünce tekrar defaultPrompt", async () => {
    const app = makeApp();
    const put = await app.request("/v1/admin/email-prompt", {
      method: "PUT",
      headers: jsonAuth("boss"),
      body: JSON.stringify({ useDefault: false, prompt: "Profesyonel ve kısa yaz; JSON döndür." }),
    });
    expect(put.status).toBe(200);
    const b1 = (await put.json()) as { useDefault: boolean; prompt: string };
    expect(b1.useDefault).toBe(false);
    expect(b1.prompt).toContain("Profesyonel ve kısa");

    const reset = await app.request("/v1/admin/email-prompt", {
      method: "PUT",
      headers: jsonAuth("boss"),
      body: JSON.stringify({ useDefault: true, prompt: "" }),
    });
    const b2 = (await reset.json()) as { prompt: string; defaultPrompt: string };
    expect(b2.prompt).toBe(b2.defaultPrompt);
  });

  it("composer DAYANIKLILIK: aktif model yoksa ham metne düşer (e-posta düşmez)", async () => {
    const composer = new SwitchableEmailComposer(
      {
        async activeSpec() {
          return null;
        },
      },
      {},
      async () => "istem",
    );
    const out = await composer.compose({ title: "Olay", body: "Detay" });
    expect(out).toEqual({ title: "Olay", body: "Detay" });
  });
});
