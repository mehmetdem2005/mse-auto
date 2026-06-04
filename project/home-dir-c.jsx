/* DIRECTION C — "Modern Ferah" : charcoal + cream, rounded, approachable */

function HomeDirC() {
  const vit = [
    { t: "Volvo XC60 Inscription", s: "2021 · 31.000 km · Dizel", p: "₺3.290.000" },
    { t: "BMW 118i Sport Line", s: "2022 · 22.000 km · Benzin", p: "₺1.580.000" },
    { t: "Mercedes A200 AMG", s: "2021 · 34.000 km · Benzin", p: "₺1.890.000" },
    { t: "Audi A3 Sportback", s: "2022 · 19.000 km · Benzin", p: "₺1.760.000" },
  ];
  const feat = [
    { t: "Mercedes GLA 200d", specs: ["2021", "28.000 km", "Dizel"], p: "₺2.480.000", addr: "MSE Auto · Merkez Şube" },
    { t: "BMW X1 sDrive18i", specs: ["2022", "16.000 km", "Benzin"], p: "₺2.940.000", addr: "MSE Auto · Merkez Şube" },
    { t: "VW Tiguan Elegance", specs: ["2021", "37.000 km", "Dizel"], p: "₺2.260.000", addr: "MSE Auto · Merkez Şube" },
  ];
  return (
    <div className="home dir-c">
      <NavBar />
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-kick">MSE AUTO</div>
            <h1>Doğru araç,<br /><span className="hl">doğru fiyatla.</span></h1>
            <p>Aramak da satmak da kolay. Filtrele, karşılaştır, 3D görünümle incele — ya da aracını birkaç dakikada değerlet.</p>
            <div className="hero-search">
              <div className="field"><span>Marka</span><b>Tümü</b></div>
              <div className="field"><span>Model</span><b>Tümü</b></div>
              <div className="field"><span>Fiyat</span><b>Tümü</b></div>
              <div className="go">Ara</div>
            </div>
          </div>
          <div className="hero-visual">
            <span className="vtag">◆ 3D GÖRÜNÜM</span>
            <image-slot id="c-hero" placeholder="Hero — lüks araç görseli" style={{ width: "100%", height: "100%" }}></image-slot>
          </div>
        </div>
      </section>
      <Vitrine idp="c" kicker="Hareketli Vitrin" heading="Bu hafta öne çıkanlar" items={vit} />
      <FeaturedGrid idp="c" kicker="Galeri" heading="Yeni eklenen araçlar" items={feat} />
      <SellBand
        kicker="Aracını Sat"
        title="Aracını sat, anında nakit al."
        sub="Hızlı değerleme, yerinde hizmet, anında ödeme. Birkaç bilgiyle başvur, gerisini biz halledelim."
        cta="Ücretsiz Değerleme"
      />
      <MiniFooter />
      <AIBubble text='<b>MSE Asistan</b> · Hangi aracı arıyorsunuz?' />
    </div>
  );
}
window.HomeDirC = HomeDirC;
