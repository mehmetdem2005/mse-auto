import { describe, expect, it } from "vitest";
import { WhatsAppSender } from "../src/infrastructure/channels/whatsapp.sender";

type WaBody = {
  messaging_product: string;
  to: string;
  type: string;
  text?: { body: string };
  template?: {
    name: string;
    language: { code: string };
    components: { type: string; parameters: { type: string; text: string }[] }[];
  };
};

function mockFetch(ok = true): { fn: typeof fetch; calls: { url: string; body: WaBody }[] } {
  const calls: { url: string; body: WaBody }[] = [];
  const fn = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body ?? "{}")) as WaBody });
    return { ok } as Response;
  }) as unknown as typeof fetch;
  return { fn, calls };
}

const msg = { title: "Yeni gelişme", body: "Konunda hareket var" };

// ADR-106: WhatsApp şablon (pencere-dışı) + serbest-metin (fallback) yolları.
describe("WhatsAppSender (ADR-106)", () => {
  it("şablon modunda type:template + dil + 2 body param gönderir", async () => {
    const { fn, calls } = mockFetch();
    const s = new WhatsAppSender("tok", "PHID", { name: "whenly_alert", lang: "tr" }, fn);
    const r = await s.send("+905551112233", msg);
    expect(r.success).toBe(true);
    expect(calls[0]?.url).toContain("/PHID/messages");
    const b = calls[0]?.body;
    expect(b?.type).toBe("template");
    expect(b?.to).toBe("+905551112233");
    expect(b?.template?.name).toBe("whenly_alert");
    expect(b?.template?.language.code).toBe("tr");
    expect(b?.template?.components[0]?.parameters).toEqual([
      { type: "text", text: "Yeni gelişme" },
      { type: "text", text: "Konunda hareket var" },
    ]);
  });

  it("şablon yoksa serbest-metin (type:text) fallback", async () => {
    const { fn, calls } = mockFetch();
    const s = new WhatsAppSender("tok", "PHID", null, fn);
    await s.send("+90555", msg);
    expect(calls[0]?.body.type).toBe("text");
    expect(calls[0]?.body.text?.body).toBe("Yeni gelişme\nKonunda hareket var");
  });

  it("Meta hata (ok:false) → success:false (iz kaydı)", async () => {
    const { fn } = mockFetch(false);
    const s = new WhatsAppSender("tok", "PHID", { name: "t", lang: "tr" }, fn);
    const r = await s.send("+90555", msg);
    expect(r.success).toBe(false);
  });
});
