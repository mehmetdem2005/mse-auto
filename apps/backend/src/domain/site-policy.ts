/**
 * Site izleme politikası portu (ADR-128). Bir alan adının otomatik izlemeye (public-web) izin
 * verip vermediğini robots.txt'ten DÜRÜSTÇE değerlendirir.
 *
 * DÜRÜST SINIR: robots.txt TAVSİYEdir, hukuki bağlayıcı DEĞİLdir; ToS ayrı bir konudur. `source`
 * kararın nereden geldiğini belirtir; UI bunu kullanıcıya açıkça gösterir.
 */
export interface SitePolicyVerdict {
  domain: string;
  /** Otomatik izleme serbest görünüyor mu (robots tam-blok değilse true). */
  allowed: boolean;
  /** İnsan-okur kısa gerekçe. */
  reason: string;
  /** Karar kaynağı: robots.txt okundu · robots yok · hata/belirsiz. */
  source: "robots" | "none" | "error";
}

export interface SitePolicyResolver {
  check(domain: string): Promise<SitePolicyVerdict>;
}
