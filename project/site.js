/* ==========================================================================
   MSE AUTO — Site etkileşimleri (içerik tabanlı, açık tema)
   Tüm metinler MSE_CONTENT'ten; araçlar boşsa iskelet/boş durum gösterilir.
   ========================================================================== */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const C = window.MSE_CONTENT || {};
  const S = window.MSE_SETTINGS || {};
  const CARS = window.MSE_CARS || [];
  const esc = (s) => String(s == null ? "" : s);

  /* ---- text injection: [data-c="hero.title"] ---- */
  const byPath = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
  $$("[data-c]").forEach((el) => {
    const v = byPath(C, el.dataset.c);
    if (typeof v === "string") el.textContent = v;
  });
  $$("[data-href]").forEach((el) => {
    const v = byPath(C, el.dataset.href);
    if (v && v.href) el.setAttribute("href", v.href);
  });

  /* ---- header scroll ---- */
  const hdr = $(".hdr");
  const onScroll = () => hdr && hdr.classList.toggle("scrolled", window.scrollY > 30);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- reveal ---- */
  const io = new IntersectionObserver(
    (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
    { threshold: 0.12 }
  );
  const obs = () => $$(".reveal:not(.in)").forEach((el) => io.observe(el));

  /* ---- features ---- */
  const feats = $("#features");
  if (feats && C.features) {
    feats.innerHTML = C.features.map((f, i) => `
      <div class="f reveal ${i ? "d" + i : ""}">
        <div class="ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12l4 4L19 7"/></svg></div>
        <b>${esc(f.title)}</b><span>${esc(f.desc)}</span>
      </div>`).join("");
  }

  /* ---- placeholder araç fotoğrafları (sürükle-bırakla değiştirilir) ---- */
  const U = (id, w) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w || 720}&q=72`;
  const PHOTOS = [
    "1503376780353-7e6692767b70", "1555215695-3004980ad54e", "1583121274602-3e2820c69888",
    "1606664515524-ed2f786a0bd6", "1494976388531-d1058494cdd8", "1568605117036-5fe5e7bab0b7",
    "1517994112540-009c47ea476b", "1605559424843-9e4c228bf1c2", "1502877338535-766e1452684a",
    "1580273916550-e323be2ae537", "1552519507-da3b142c6e3d", "1542362567-b07e54358753",
  ];
  const photoAt = (i) => U(PHOTOS[i % PHOTOS.length]);

  /* ---- car card renderers ---- */
  const realCard = (c, extra = "", i = 0) => `
    <a class="car ${extra}" href="#">
      <div class="cimg">
        ${c.has3d ? '<span class="badge"><b>◆</b> 3D Görünüm</span>' : ""}
        <button class="fav" aria-label="Favori">♡</button>
        <img src="${c.image || photoAt(i)}" alt="${esc(c.title)}" loading="lazy" />
      </div>
      <div class="cbody">
        <h3>${esc(c.title)}</h3>
        <div class="spec-row">
          <div class="spec-cell"><b>${esc(c.year)}</b><span>Yıl</span></div>
          <div class="spec-cell"><b>${esc(c.km)}</b><span>km</span></div>
          <div class="spec-cell"><b>${esc(c.fuel)}</b><span>Yakıt</span></div>
        </div>
        <div class="crow"><div class="cprice">${esc(c.price)}</div><span class="ul-link">Detay <span class="ar">→</span></span></div>
        <div class="caddr">📍 ${esc(S.address)}</div>
      </div>
    </a>`;
  // boş durum: GÖRSEL placeholder (gerçek foto) + UYDURMA SAYI YOK
  const skelCard = (extra = "", i = 0) => `
    <div class="car skeleton ${extra}">
      <div class="cimg"><span class="badge"><b>◆</b> 3D Görünüm</span><button class="fav" aria-label="Favori">♡</button><img src="${photoAt(i)}" alt="Örnek araç" loading="lazy" /></div>
      <div class="cbody">
        <h3 style="color:var(--muted);font-weight:600;font-size:16px">Araç modeli</h3>
        <div class="spec-row">
          <div class="spec-cell"><b>—</b><span>Yıl</span></div>
          <div class="spec-cell"><b>—</b><span>km</span></div>
          <div class="spec-cell"><b>—</b><span>Yakıt</span></div>
        </div>
        <div class="crow"><div class="cprice empty">Fiyat · panelden</div><span class="ul-link" style="color:var(--muted)">Detay <span class="ar">→</span></span></div>
        <div class="caddr">📍 ${esc(S.address)}</div>
      </div>
    </div>`;

  /* ---- vitrine (marquee) ---- */
  const track = $("#vitrineTrack");
  if (track) {
    let html;
    if (CARS.length) html = CARS.slice(0, 6).map((c, i) => realCard(c, "vcard", i)).join("");
    else html = Array.from({ length: 5 }, (_, i) => skelCard("vcard", i)).join("");
    track.innerHTML = html + html;
  }

  /* ---- gallery grid + empty state ---- */
  const grid = $("#carsGrid");
  const emptyBanner = $("#emptyState");
  if (grid) {
    if (CARS.length) {
      if (emptyBanner) emptyBanner.style.display = "none";
      grid.innerHTML = CARS.slice(0, 6).map((c, i) => realCard(c, "reveal", i)).join("");
    } else {
      grid.innerHTML = Array.from({ length: 3 }, (_, i) => skelCard("reveal", i)).join("");
    }
    grid.addEventListener("click", (e) => {
      const f = e.target.closest(".fav");
      if (f) { e.preventDefault(); const on = f.textContent.trim() === "♡"; f.textContent = on ? "♥" : "♡"; f.style.color = on ? "#b23b3b" : ""; }
    });
  }

  /* ---- footer columns ---- */
  const fcols = $("#footCols");
  if (fcols && C.footer && C.footer.cols) {
    fcols.innerHTML = C.footer.cols.map((col) => `
      <div><h5>${esc(col.h)}</h5><ul>${col.items.map((i) => `<li><a href="#">${esc(i)}</a></li>`).join("")}</ul></div>`).join("");
  }

  /* ---- mobile drawer ---- */
  const drawer = $("#drawer");
  $("#burger") && $("#burger").addEventListener("click", () => drawer.classList.add("open"));
  $("#drawerClose") && $("#drawerClose").addEventListener("click", () => drawer.classList.remove("open"));
  $$("#drawer nav a").forEach((a) => a.addEventListener("click", () => drawer.classList.remove("open")));

  /* ======================================================================
     AI ASISTAN
     PRODÜKSİYON: POST /api/ai/chat -> Render backend -> Groq
     (model: openai/gpt-oss-120b) + function calling. Aşağıdaki TOOLS,
     panelden açılıp kapatılabilen (ve konuşarak eklenebilen) yeteneklerdir.
     Anahtar gelene kadar gerçekçi yerel simülasyon çalışır — uydurma araç
     verisi üretmez; stok boşsa onu söyler.
     ====================================================================== */
  const AI = C.assistant || {};
  const TOOLS = ["searchCars", "getCarDetails", "createValuation", "bookAppointment", "getFinancingInfo", "getFAQ", "getContactInfo"];

  function localAnswer(q) {
    const t = q.toLowerCase();
    if (/(sat|değerle|degerle|nakit|aracım|aracimi|sattır)/.test(t))
      return "Aracınızı değerinde nakit alıyoruz. Marka, model, yıl, km ve birkaç fotoğraf paylaşırsanız değerleme talebinizi oluşturayım. Başlayalım mı?";
    if (/(randevu|gel|ziyaret|test|görmek|gorebilir)/.test(t))
      return `Memnuniyetle randevu oluşturayım. Adınız, telefonunuz ve uygun gününüzü yazın. 📍 ${esc(S.address)} · 🕒 ${esc(S.hours)}`;
    if (/(takas|finans|kredi|senet|taksit)/.test(t))
      return "Takas ve finansman seçeneklerimiz mevcut. Takas için aracınızın bilgilerini, kredi için peşinat ve vade tercihinizi paylaşın; uygun seçenekleri çıkarayım.";
    if (/(adres|nerede|konum|telefon|iletişim|iletisim|saat|açık|acik)/.test(t))
      return `📞 ${esc(S.phone)}<br>📍 ${esc(S.address)}<br>🕒 ${esc(S.hours)}`;
    if (/(fiyat|araç|araba|model|öner|oner|ara|satılık|bütçe|butce)/.test(t)) {
      if (CARS.length) {
        const top = CARS.slice(0, 3).map((c) => `• ${c.title} — ${c.price}`).join("<br>");
        return `Birkaç seçenek:<br>${top}<br><br>Marka/bütçe söylerseniz daraltayım.`;
      }
      return "Stok bilgisi yöneticinin panelinden güncellenir. Aradığınız marka, bütçe ve kullanım amacını yazarsanız, ekleme yapıldıkça size en uygununu önerebilir ve dilerseniz randevu oluşturabilirim.";
    }
    return "Size satılık araçlar, fiyatlar, takas/finansman, randevu ve aracınızı sattırma konularında yardımcı olabilirim. Ne yapmak istersiniz?";
  }

  window.MSE_AI = {
    tools: TOOLS,
    history: [],
    async ask(q) {
      this.history.push({ role: "user", content: q });
      const apiBase = window.MSE_API_BASE || localStorage.getItem("mse_api_base");
      const groqKey = window.MSE_GROQ_KEY || localStorage.getItem("mse_groq_key");

      // Try backend proxy first
      if (apiBase && apiBase !== "https://mse-auto-api.onrender.com") {
        try {
          const r = await fetch(apiBase + "/api/chat", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: q, history: this.history.slice(-6) }),
          });
          if (r.ok) {
            const d = await r.json();
            this.history.push({ role: "assistant", content: d.reply });
            return d.reply;
          }
        } catch (_) { /* try next */ }
      }

      // Try Groq directly (client-side, API key must be configured)
      if (groqKey) {
        try {
          const sysPrompt = `Sen MSE Auto'nun yapay zeka asistanısın. MSE Auto güvenilir bir 2. el araç alım-satım galerisidir. Türkçe, kısa ve yardımsever cevap ver. Uydurma fiyat verme.`;
          const msgs = [
            { role: "system", content: sysPrompt },
            ...this.history.slice(-6).map((h) => ({ role: h.role, content: h.content })),
          ];
          const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + groqKey },
            body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: msgs, max_tokens: 512, temperature: 0.7 }),
          });
          if (r.ok) {
            const d = await r.json();
            const reply = d.choices[0].message.content;
            this.history.push({ role: "assistant", content: reply });
            return reply;
          }
        } catch (_) { /* fallback */ }
      }

      await new Promise((r) => setTimeout(r, 600));
      return localAnswer(q);
    },
  };

  const orb = $("#aiOrb"), panel = $("#aiPanel"), body = $("#aiBody"), input = $("#aiInput"), hint = $("#aiHint");
  // build chips + greeting from content
  if (body && AI.greeting) body.innerHTML = `<div class="msg bot">${AI.greeting}</div>`;
  const chipsWrap = $("#aiChips");
  if (chipsWrap && AI.chips) chipsWrap.innerHTML = AI.chips.map((c) => `<button data-q="${esc(c.q)}">${esc(c.label)}</button>`).join("");

  const toggle = (open) => { panel.classList.toggle("open", open); if (open && hint) hint.style.display = "none"; };
  orb && orb.addEventListener("click", () => toggle(!panel.classList.contains("open")));
  $("#aiClose") && $("#aiClose").addEventListener("click", () => toggle(false));

  function addMsg(text, who) { const m = document.createElement("div"); m.className = "msg " + who; m.innerHTML = text; body.appendChild(m); body.scrollTop = body.scrollHeight; return m; }
  function typing() { const t = document.createElement("div"); t.className = "msg bot typing"; t.innerHTML = "<i></i><i></i><i></i>"; body.appendChild(t); body.scrollTop = body.scrollHeight; return t; }
  async function send(q) {
    if (!q || !q.trim()) return;
    addMsg(q, "me"); input.value = "";
    const t = typing();
    const reply = await window.MSE_AI.ask(q);
    t.remove(); addMsg(reply, "bot");
  }
  $("#aiSend") && $("#aiSend").addEventListener("click", () => send(input.value));
  input && input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(input.value); });
  chipsWrap && chipsWrap.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { toggle(true); send(b.dataset.q || b.textContent); } });

  obs();
})();
