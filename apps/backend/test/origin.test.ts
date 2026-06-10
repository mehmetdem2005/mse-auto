import { describe, expect, it } from "vitest";
import {
  fetchOriginText,
  htmlToText,
  isFetchableDomain,
  isInformative,
} from "../src/infrastructure/search/origin";

describe("canlı kaynak okuma (ADR-047)", () => {
  it("SSRF koruması: IP/localhost/iç ağ reddedilir, kamusal alan kabul", () => {
    expect(isFetchableDomain("osym.gov.tr")).toBe(true);
    expect(isFetchableDomain("example.com")).toBe(true);
    expect(isFetchableDomain("localhost")).toBe(false);
    expect(isFetchableDomain("127.0.0.1")).toBe(false);
    expect(isFetchableDomain("db.internal")).toBe(false);
    expect(isFetchableDomain("evil.local")).toBe(false);
    expect(isFetchableDomain("not a domain!")).toBe(false);
  });

  it("HTML'i metne indirger: script/style söker, etiketleri temizler, kırpar", () => {
    const html =
      "<html><head><style>.x{color:red}</style><script>alert(1)</script></head>" +
      "<body><h1>Duyuru</h1><p>Sınav&nbsp;giriş belgeleri yayımlandı.</p></body></html>";
    const text = htmlToText(html);
    expect(text).toContain("Duyuru");
    expect(text).toContain("giriş belgeleri yayımlandı");
    expect(text).not.toContain("alert");
    expect(text).not.toContain("color:red");
  });

  it("çöp filtresi: çerez/gizlilik bandı içeriği değersiz sayılır (ADR-048)", () => {
    expect(
      isInformative("Bu sayfa çerez kullanır. Gizlilik politikası. KVKK aydınlatma metni."),
    ).toBe(false);
    expect(isInformative("kısa")).toBe(false);
    expect(
      isInformative(
        "YKS giriş belgeleri bugün yayımlandı. Adaylar sonuç sayfasından erişebilir; sınav 15 Haziran.",
      ),
    ).toBe(true);
  });

  it("başarılı çekimde metni döner; hata/kısa içerikte null", async () => {
    const okFetch: typeof fetch = (async () =>
      ({
        ok: true,
        status: 200,
        text: async () => `<body>${"Resmî duyuru metni. ".repeat(10)}</body>`,
      }) as Response) as typeof fetch;
    expect(await fetchOriginText("kurum.gov.tr", okFetch)).toContain("Resmî duyuru");

    const failFetch: typeof fetch = (async () =>
      ({ ok: false, status: 500 }) as Response) as typeof fetch;
    expect(await fetchOriginText("kurum.gov.tr", failFetch)).toBeNull();

    expect(await fetchOriginText("localhost", okFetch)).toBeNull(); // guard fetch'e gitmez
  });
});
