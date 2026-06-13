import type { AdminProviders, LlmConfig } from "@watcher/contracts";
import { describe, expect, it } from "vitest";
import { createContainer } from "../src/config/container";
import type { Env } from "../src/config/env";
import { createApp } from "../src/interfaces/http/app";

// ADR-095: global LLM model seçimi + sağlayıcı kullanım panosu uçları.
function makeApp(extra: Partial<Env> = {}): ReturnType<typeof createApp> {
  const env: Env = {
    NODE_ENV: "development",
    PORT: 3000,
    RATE_LIMIT_PER_MINUTE: 1000,
    WATCH_CREATE_PER_HOUR: 1000,
    ASSIST_PER_MINUTE: 1000,
    ADMIN_USER_IDS: "boss",
    ...extra,
  };
  return createApp(createContainer(env));
}

const bearer = (uid: string): Record<string, string> => ({ Authorization: `Bearer ${uid}` });
const putJson = (body: unknown, uid: string): RequestInit => ({
  method: "PUT",
  headers: { "Content-Type": "application/json", ...bearer(uid) },
  body: JSON.stringify(body),
});

describe("admin LLM model seçimi (ADR-095)", () => {
  it("admin olmayan → 403", async () => {
    const res = await makeApp().request("/v1/admin/model", { headers: bearer("user") });
    expect(res.status).toBe(403);
  });

  it("anahtarsız ortam: aktif yok, katalog tamamen kullanılamaz", async () => {
    const res = await makeApp().request("/v1/admin/model", { headers: bearer("boss") });
    expect(res.status).toBe(200);
    const cfg = (await res.json()) as LlmConfig;
    expect(cfg.active).toBeNull();
    expect(cfg.models.length).toBeGreaterThanOrEqual(4);
    expect(cfg.models.every((m) => !m.available)).toBe(true);
  });

  it("Groq anahtarı varsa varsayılan Groq; DeepSeek modeline geçilebilir (iki anahtar)", async () => {
    const app = makeApp({ GROQ_API_KEY: "gk", DEEPSEEK_API_KEY: "dk" });
    const cfg = (await (
      await app.request("/v1/admin/model", { headers: bearer("boss") })
    ).json()) as LlmConfig;
    expect(cfg.active).toBe("groq/llama-3.3-70b-versatile");
    expect(cfg.models.every((m) => m.available)).toBe(true);

    const put = await app.request(
      "/v1/admin/model",
      putJson({ model: "deepseek/deepseek-v4-pro" }, "boss"),
    );
    expect(put.status).toBe(200);
    const after = (await put.json()) as LlmConfig;
    expect(after.active).toBe("deepseek/deepseek-v4-pro");
    // In-memory ayar deposu kalıcı sayılır → persisted true.
    expect(after.persisted).toBe(true);

    // GET aynı seçimi görür (ayar deposundan).
    const again = (await (
      await app.request("/v1/admin/model", { headers: bearer("boss") })
    ).json()) as LlmConfig;
    expect(again.active).toBe("deepseek/deepseek-v4-pro");
  });

  it("bilinmeyen model → 400; anahtarı olmayan sağlayıcı → 400", async () => {
    const app = makeApp({ GROQ_API_KEY: "gk" }); // DeepSeek anahtarı YOK
    const unknown = await app.request("/v1/admin/model", putJson({ model: "openai/gpt" }, "boss"));
    expect(unknown.status).toBe(400);
    const unavailable = await app.request(
      "/v1/admin/model",
      putJson({ model: "deepseek/deepseek-reasoner" }, "boss"),
    );
    expect(unavailable.status).toBe(400);
    const body = (await unavailable.json()) as { error: string };
    expect(body.error).toContain("DEEPSEEK_API_KEY");
  });
});

describe("admin sağlayıcı kullanım panosu (ADR-095)", () => {
  it("token'sız ortam: 5 kart, hepsi dürüstçe configured=false (Groq/DeepSeek anahtarsız)", async () => {
    const res = await makeApp().request("/v1/admin/providers", { headers: bearer("boss") });
    expect(res.status).toBe(200);
    const { providers } = (await res.json()) as AdminProviders;
    expect(providers.map((p) => p.id)).toEqual([
      "deepseek",
      "groq",
      "supabase",
      "render",
      "vercel",
    ]);
    for (const p of providers) {
      expect(p.configured).toBe(false);
      expect(p.ok).toBe(false);
      expect(p.error).toBeTruthy(); // hangi env eksik, açıkça yazar
      expect(p.metrics).toEqual([]);
    }
  });

  it("Groq anahtarı varsa: kullanım API'si olmadığı DÜRÜSTÇE söylenir", async () => {
    const res = await makeApp({ GROQ_API_KEY: "gk" }).request("/v1/admin/providers", {
      headers: bearer("boss"),
    });
    const { providers } = (await res.json()) as AdminProviders;
    const groq = providers.find((p) => p.id === "groq");
    expect(groq?.configured).toBe(true);
    expect(groq?.ok).toBe(true);
    expect(groq?.metrics.some((m) => m.value.includes("sunmuyor"))).toBe(true);
  });
});
