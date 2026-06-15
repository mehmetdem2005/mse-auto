import { describe, expect, it } from "vitest";
import { createContainer } from "../src/config/container";
import type { Env } from "../src/config/env";
import { createApp } from "../src/interfaces/http/app";

// ADR-148: free kullanıcı watcher limitine takılınca bell'de tek-seferlik "Pro'ya yüksel" sistem bildirimi.
function makeApp(): ReturnType<typeof createApp> {
  const env: Env = {
    NODE_ENV: "development",
    PORT: 3000,
    RATE_LIMIT_PER_MINUTE: 1000,
    WATCH_CREATE_PER_HOUR: 1000,
    ASSIST_PER_MINUTE: 1000,
  };
  return createApp(createContainer(env));
}
const bearer = (uid: string): Record<string, string> => ({ Authorization: `Bearer ${uid}` });
const post = (body: unknown, uid: string): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json", ...bearer(uid) },
  body: JSON.stringify(body),
});
const limitNudges = async (app: ReturnType<typeof createApp>, uid: string): Promise<unknown[]> => {
  const res = await app.request("/v1/announcements", { headers: bearer(uid) });
  const list = (await res.json()) as { templateKey: string | null }[];
  return list.filter((a) => a.templateKey === "watchLimit");
};

describe("watcher limiti yükselt-bildirimi (ADR-148)", () => {
  it("free 3 limitine takılınca tek 'watchLimit' bildirimi açılır + dedup", async () => {
    const app = makeApp();
    for (let i = 0; i < 3; i++) {
      const r = await app.request(
        "/v1/watchers",
        post({ rawIntent: `izleme ${i}`, frequencyMinutes: 60 }, "u1"),
      );
      expect(r.status).toBe(201);
    }
    // Limitte daha yok
    expect(await limitNudges(app, "u1")).toHaveLength(0);

    // 4. → 403 + bildirim açılır
    const fourth = await app.request(
      "/v1/watchers",
      post({ rawIntent: "izleme 4", frequencyMinutes: 60 }, "u1"),
    );
    expect(fourth.status).toBe(403);
    expect(await limitNudges(app, "u1")).toHaveLength(1);

    // 5. → 403; DEDUP: hâlâ tek bildirim
    const fifth = await app.request(
      "/v1/watchers",
      post({ rawIntent: "izleme 5", frequencyMinutes: 60 }, "u1"),
    );
    expect(fifth.status).toBe(403);
    expect(await limitNudges(app, "u1")).toHaveLength(1);
  });

  it("limite takılmayan kullanıcıda bildirim yok", async () => {
    const app = makeApp();
    await app.request(
      "/v1/watchers",
      post({ rawIntent: "tek izleme", frequencyMinutes: 60 }, "u2"),
    );
    expect(await limitNudges(app, "u2")).toHaveLength(0);
  });
});
