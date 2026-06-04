/* Shared building blocks for the three home-page directions.
   Exposed on window so each direction file can compose them. */

function AIOrbIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M12 3l1.6 4.2L18 8.8l-3.4 2.6L15.8 16 12 13.2 8.2 16l1.2-4.6L6 8.8l4.4-1.6L12 3z"
        fill="#1a1206" />
    </svg>
  );
}

function AIBubble({ text }) {
  return (
    <div className="ai-bubble">
      <div className="label" dangerouslySetInnerHTML={{ __html: text }} />
      <div className="ai-orb"><AIOrbIcon /></div>
    </div>
  );
}

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M12 22s7-7.6 7-13a7 7 0 10-14 0c0 5.4 7 13 7 13z" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="9" r="2.4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function VitrineCard({ idp, title, sub, price }) {
  return (
    <div className="vcard">
      <div className="slot">
        <image-slot id={idp} placeholder={title} style={{ width: "100%", height: "100%" }}></image-slot>
      </div>
      <div className="vmeta">
        <h4>{title}</h4>
        <p>{sub}</p>
        <div className="vprice">{price}</div>
      </div>
    </div>
  );
}

function Vitrine({ idp, kicker, heading, items }) {
  const loop = items.concat(items);
  return (
    <section className="vitrine">
      <div className="vitrine-head">
        <div>
          <div className="kicker">{kicker}</div>
          <h2 className="sec-title">{heading}</h2>
        </div>
        <div className="sec-link">Tüm araçlar →</div>
      </div>
      <div className="vitrine-track-wrap">
        <div className="vitrine-track">
          {loop.map((it, i) => (
            <VitrineCard key={i} idp={`${idp}-v${i}`} title={it.t} sub={it.s} price={it.p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedCard({ idp, title, specs, price, addr }) {
  return (
    <div className="fcard">
      <div className="fimg">
        <span className="badge3d">◆ 3D GÖRÜNÜM</span>
        <image-slot id={idp} placeholder={title} style={{ width: "100%", height: "100%" }}></image-slot>
      </div>
      <div className="fbody">
        <h3>{title}</h3>
        <div className="fspecs">
          {specs.map((s, i) => <span key={i}>{s}</span>)}
        </div>
        <div className="frow">
          <div className="fprice">{price}</div>
          <div className="sec-link">İncele →</div>
        </div>
        <div className="faddr"><PinIcon />{addr}</div>
      </div>
    </div>
  );
}

function FeaturedGrid({ idp, kicker, heading, items }) {
  return (
    <section className="featured">
      <div className="vitrine-head" style={{ padding: "0 0 24px" }}>
        <div>
          <div className="kicker">{kicker}</div>
          <h2 className="sec-title">{heading}</h2>
        </div>
        <div className="sec-link">Galeriye git →</div>
      </div>
      <div className="feat-grid">
        {items.map((it, i) => (
          <FeaturedCard key={i} idp={`${idp}-f${i}`} title={it.t} specs={it.specs} price={it.p} addr={it.addr} />
        ))}
      </div>
    </section>
  );
}

function SellBand({ kicker, title, sub, cta }) {
  const steps = [
    { n: "1", b: "Bilgileri gönder", s: "Marka, model, km, fotoğraf" },
    { n: "2", b: "Değerleme al", s: "Uzman ekip 24 saatte arar" },
    { n: "3", b: "Anında nakit", s: "Anlaşınca yerinde ödeme" },
  ];
  return (
    <section className="sellband">
      <div className="sb-text">
        <div className="sb-kick">{kicker}</div>
        <div className="sb-title">{title}</div>
        <div className="sb-sub">{sub}</div>
        <div className="sb-cta">{cta} →</div>
      </div>
      <div className="sb-steps">
        {steps.map((st, i) => (
          <div className="sb-step" key={i}>
            <div className="n">{st.n}</div>
            <div className="t"><b>{st.b}</b><span>{st.s}</span></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MiniFooter() {
  return (
    <footer className="foot">
      <div className="fcol">
        <h5>MSE AUTO</h5>
        <p>Güvenilir 2. el alım & satım</p>
        <p>Değerinde nakit, kolay işlem.</p>
      </div>
      <div className="fcol">
        <h5>Keşfet</h5>
        <p>Satılık Araçlar</p>
        <p>Aracını Sat</p>
        <p>Blog</p>
      </div>
      <div className="fcol">
        <h5>İletişim</h5>
        <p>0 (5xx) xxx xx xx · WhatsApp</p>
        <p>Adres · panelden gelir</p>
        <p>Hafta içi 09:00 – 19:00</p>
      </div>
    </footer>
  );
}

function NavBar({ light }) {
  return (
    <nav className="nav">
      <div className="nav-logo">
        <span className="mark">MSE<b>.</b></span>
        <span className="sub">AUTO</span>
      </div>
      <ul className="nav-links">
        <li>Araçlar</li>
        <li>Aracını Sat</li>
        <li>Hakkımızda</li>
        <li>Blog</li>
        <li>İletişim</li>
      </ul>
      <div className="nav-cta">📞 Hemen Ara</div>
    </nav>
  );
}

Object.assign(window, {
  AIBubble, Vitrine, FeaturedGrid, SellBand, MiniFooter, NavBar, VitrineCard, FeaturedCard,
});
