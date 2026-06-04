/* DIRECTION B — "Showroom Bold" : heavy grotesque, gold blocks, energetic */

function HomeDirB() {
  const vit = [
    { t: "Range Rover Velar", s: "2021 · 36.000 km · Dizel", p: "₺4.250.000" },
    { t: "BMW 320i M Sport", s: "2022 · 18.000 km · Benzin", p: "₺2.640.000" },
    { t: "Mercedes GLC 220d", s: "2020 · 58.000 km · Dizel", p: "₺3.180.000" },
    { t: "VW Golf 1.5 TSI", s: "2022 · 27.000 km · Benzin", p: "₺1.420.000" },
  ];
  const feat = [
    { t: "Audi Q5 45 TFSI", specs: ["2021", "33.000 km", "Benzin"], p: "₺3.450.000", addr: "MSE Auto · Merkez Şube" },
    { t: "Mercedes C200 AMG", specs: ["2020", "52.000 km", "Benzin"], p: "₺2.150.000", addr: "MSE Auto · Merkez Şube" },
    { t: "BMW 520i Luxury", specs: ["2021", "38.000 km", "Benzin"], p: "₺2.450.000", addr: "MSE Auto · Merkez Şube" },
  ];
  return (
    <div className="home dir-b">
      <NavBar />
      <section className="hero">
        <div className="hero-content">
          <span className="hero-kick">GÜVENİLİR 2. EL GALERİ</span>
          <h1>Araçlarınız<br /><span className="hl">değerinde</span><br />nakit alınır.</h1>
          <p>Hızlı değerleme, yerinde hizmet ve anında nakit ödeme. Almak ya da satmak — her iki yönde de güvenilir işlem.</p>
          <div className="hero-actions">
            <div className="btn-gold">Aracımı Sattır</div>
            <div className="btn-ghost">Satılık Araçlar</div>
          </div>
        </div>
        <div className="hero-visual">
          <image-slot id="b-hero" placeholder="Hero — lüks araç görseli" style={{ width: "100%", height: "100%" }}></image-slot>
          <div className="hero-trust">
            <div className="chip"><b>Hızlı Değerleme</b><span>24 saat içinde</span></div>
            <div className="chip"><b>Anında Nakit</b><span>Yerinde ödeme</span></div>
            <div className="chip"><b>Güvenilir İşlem</b><span>Şeffaf süreç</span></div>
          </div>
        </div>
      </section>
      <Vitrine idp="b" kicker="Hareketli Vitrin" heading="Galeriden seçmeler" items={vit} />
      <FeaturedGrid idp="b" kicker="Stok" heading="Öne çıkan araçlar" items={feat} />
      <SellBand
        kicker="Aracını Sat"
        title="3 adımda aracınız nakde dönsün."
        sub="Bilgileri gönderin, değerlemeyi alın, anlaşınca yerinde nakit ödemeyi yapalım. Komisyon yok, sürpriz yok."
        cta="Hemen Başla"
      />
      <MiniFooter />
      <AIBubble text='<b>MSE Asistan</b> · Aracınızı değerleyeyim mi?' />
    </div>
  );
}
window.HomeDirB = HomeDirB;
