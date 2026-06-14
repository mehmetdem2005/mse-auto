import { describe, expect, it, vi } from "vitest";
import {
  RobotsSitePolicyResolver,
  isFullyDisallowed,
} from "../src/infrastructure/search/site-policy";

describe("isFullyDisallowed — robots.txt tam-blok ayrıştırma (ADR-128)", () => {
  it("User-agent: * + Disallow: / → tam blok", () => {
    expect(isFullyDisallowed("User-agent: *\nDisallow: /")).toBe(true);
  });
  it("kısmi Disallow → blok değil", () => {
    expect(isFullyDisallowed("User-agent: *\nDisallow: /private\nDisallow: /admin")).toBe(false);
  });
  it("Disallow: / ama Allow: / → blok değil (gevşetilmiş)", () => {
    expect(isFullyDisallowed("User-agent: *\nDisallow: /\nAllow: /")).toBe(false);
  });
  it("yalnız BAŞKA bota Disallow: / → bizi kapsamaz, blok değil", () => {
    expect(isFullyDisallowed("User-agent: googlebot\nDisallow: /")).toBe(false);
  });
  it("WhenlyBot'a özel Disallow: / → blok", () => {
    expect(isFullyDisallowed("User-agent: WhenlyBot\nDisallow: /")).toBe(true);
  });
  it("boş/yorumlu robots → blok değil", () => {
    expect(isFullyDisallowed("# sadece yorum\n\n")).toBe(false);
  });
});

function res(status: number, body = ""): Response {
  return new Response(body, { status, headers: { "Content-Type": "text/plain" } });
}

describe("RobotsSitePolicyResolver.check (ADR-128)", () => {
  it("Disallow: / → allowed=false, source=robots", async () => {
    const f = vi.fn(async () => res(200, "User-agent: *\nDisallow: /")) as unknown as typeof fetch;
    const v = await new RobotsSitePolicyResolver(null, f).check("example.com");
    expect(v.allowed).toBe(false);
    expect(v.source).toBe("robots");
  });

  it("404 → allowed=true, source=none", async () => {
    const f = vi.fn(async () => res(404)) as unknown as typeof fetch;
    const v = await new RobotsSitePolicyResolver(null, f).check("example.com");
    expect(v.allowed).toBe(true);
    expect(v.source).toBe("none");
  });

  it("ağ hatası → allowed=true, source=error (izleme engellenmez)", async () => {
    const f = vi.fn(async () => {
      throw new Error("network");
    }) as unknown as typeof fetch;
    const v = await new RobotsSitePolicyResolver(null, f).check("example.com");
    expect(v.allowed).toBe(true);
    expect(v.source).toBe("error");
  });

  it("geçersiz/özel domain → SSRF reddi (allowed=false, source=error, fetch çağrılmaz)", async () => {
    const f = vi.fn(async () => res(200)) as unknown as typeof fetch;
    const v = await new RobotsSitePolicyResolver(null, f).check("localhost");
    expect(v.allowed).toBe(false);
    expect(v.source).toBe("error");
    expect(f).not.toHaveBeenCalled();
  });

  it("24s cache: ikinci çağrı yeniden fetch ETMEZ", async () => {
    const f = vi.fn(async () => res(200, "User-agent: *\nDisallow: /x")) as unknown as typeof fetch;
    const r = new RobotsSitePolicyResolver(null, f);
    await r.check("example.com");
    await r.check("example.com");
    expect((f as unknown as { mock: { calls: unknown[] } }).mock.calls).toHaveLength(1);
  });
});
