import { describe, expect, it } from "vitest";
import {
  type HostResolver,
  isPrivateIp,
  isPublicHost,
  safeFetch,
} from "../src/infrastructure/search/ssrf-guard";

// ADR-156: SSRF koruması — checker/fizibilite ajanı kullanıcı-önerili domain'leri sunucuda çeker.
describe("SSRF guard (ADR-156)", () => {
  it("isPrivateIp: özel/iç/metadata IP'leri true, kamusal false, geçersiz güvensiz", () => {
    for (const ip of [
      "127.0.0.1",
      "169.254.169.254", // bulut metadata
      "10.1.2.3",
      "192.168.1.1",
      "172.16.0.1",
      "100.64.0.1",
      "0.0.0.0",
      "::1",
      "fe80::1",
      "fd00::1",
    ]) {
      expect(isPrivateIp(ip)).toBe(true);
    }
    for (const ip of ["1.1.1.1", "8.8.8.8", "93.184.216.34", "2606:4700:4700::1111"]) {
      expect(isPrivateIp(ip)).toBe(false);
    }
    expect(isPrivateIp("not-an-ip")).toBe(true);
  });

  it("isPublicHost: localhost/iç-ad/özel-IP red; DNS özel IP'ye çözülürse (rebinding) red", async () => {
    const toPrivate: HostResolver = async () => ["169.254.169.254"];
    const toPublic: HostResolver = async () => ["93.184.216.34"];
    expect(await isPublicHost("localhost", toPublic)).toBe(false);
    expect(await isPublicHost("db.internal", toPublic)).toBe(false);
    expect(await isPublicHost("127.0.0.1", toPublic)).toBe(false); // IP literal
    expect(await isPublicHost("169.254.169.254", toPublic)).toBe(false);
    // DNS-rebinding: kamusal görünen ad özel IP'ye çözülürse reddedilir
    expect(await isPublicHost("metadata.evil.com", toPrivate)).toBe(false);
    expect(await isPublicHost("real.example.com", toPublic)).toBe(true);
    expect(await isPublicHost("1.1.1.1", toPublic)).toBe(true); // kamusal IP literal
  });

  it("safeFetch: public→private REDIRECT engellenir (metadata kaçışı kapanır)", async () => {
    const toPublic: HostResolver = async () => ["93.184.216.34"];
    let calls = 0;
    const fetchImpl = (async (url: string) => {
      calls++;
      if (url.startsWith("https://evil.example")) {
        return new Response(null, {
          status: 302,
          headers: { location: "https://169.254.169.254/latest/meta-data/" },
        });
      }
      return new Response("secret", { status: 200 });
    }) as unknown as typeof fetch;
    const res = await safeFetch("https://evil.example/", fetchImpl, {}, { resolve: toPublic });
    expect(res).toBeNull(); // redirect hedefi özel → engellendi
    expect(calls).toBe(1); // ikinci (metadata) fetch HİÇ yapılmadı
  });

  it("safeFetch: https olmayan reddedilir; kamusal https 200 döner", async () => {
    const toPublic: HostResolver = async () => ["93.184.216.34"];
    const ok = (async () => new Response("ok", { status: 200 })) as unknown as typeof fetch;
    expect(await safeFetch("http://example.com/", ok, {}, { resolve: toPublic })).toBeNull();
    const r = await safeFetch("https://example.com/", ok, {}, { resolve: toPublic });
    expect(r?.status).toBe(200);
  });
});
