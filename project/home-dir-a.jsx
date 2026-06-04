/* DIRECTION A — "Sinematik Vitrin" : elegant serif, ultra-dark, cinematic */

function HomeDirA() {
  const vit = [
    { t: "BMW 5.20i Luxury", s: "2021 · 38.000 km · Otomatik", p: "₺2.450.000" },
    { t: "Mercedes C200 AMG", s: "2020 · 52.000 km · Dizel", p: "₺2.150.000" },
    { t: "Audi A6 quattro", s: "2022 · 21.000 km · Otomatik", p: "₺3.100.000" },
    { t: "VW Passat Elegance", s: "2021 · 44.000 km · Dizel", p: "₺1.640.000" },
  ];
  const feat = [
    { t: "Mercedes E220d Exclusive", specs: ["2021", "29.500 km", "Dizel"], p: "₺2.890.000", addr: "MSE Auto · Merkez Şube" },
    { t: "BMW 320i M Sport", specs: ["2022", "18.000 km", "Benzin"], p: "₺2.640.000", addr: "MSE Auto · Merkez Şube" },
    { t: "Audi A4 40 TDI", specs: ["2021", "41.000 km", "Dizel"], p: "₺2.310.000", addr: "MSE Auto · Merkez Şube" },
  ];
  return (
    <div className="home dir-a">
      <NavBar />
      <section className="hero">
        <div className="hero-img">
          <image-slot id="a-hero" placeholder="Hero — lüks araç görseli" style={{ width: "100%", height: "100%" }}></image-slot>
        </div>
        <div className="hero-content">
          <div className="hero-kick">MSE AUTO · 2. EL GALERİ</div>
          <h1>Değerinde araç,<br /><em>kusursuz</em> hizmet.</h1>
          <p>Özenle seçilmiş ikinci el araçlar; şeffaf ekspertiz, güvenilir işlem ve aracınız için anında nakit teklif.</p>
          <div className="hero-actions">
            <div className="btn-gold">Araçları Keşfet</div>
            <div className="btn-ghost">Aracımı Sat</div>
          </div>
        </div>
        <div className="hero-stats">
          <div className="st"><b>500+</b><span>Satılan Araç</span></div>
          <div className="st"><b>24sa</b><span>Değerleme</span></div>
          <div className="st"><b>%100</b><span>Güvenli İşlem</span></div>
        </div>
      </section>
      <Vitrine idp="a" kicker="Hareketli Vitrin" heading="Öne çıkan araçlar" items={vit} />
      <FeaturedGrid idp="a" kicker="Galeri" heading="Yeni eklenenler" items={feat} />
      <SellBand
        kicker="Aracınızı mı satıyorsunuz?"
        title="Aracınız değerinde, anında nakit."
        sub="Birkaç bilgi ve fotoğrafla başvurun; uzman ekibimiz değerleme yapsın, anlaşınca ödemeyi yerinde yapalım."
        cta="Ücretsiz Değerleme Al"
      />
      <MiniFooter />
      <AIBubble text='<b>MSE Asistan</b> · Size nasıl yardımcı olabilirim?' />
    </div>
  );
}
window.HomeDirA = HomeDirA;
