/* ==========================================================================
   MSE AUTO — Site etkileşimleri (dark theme)
   Tüm metinler MSE_CONTENT'ten; araçlar boşsa iskelet/boş durum gösterilir.
   ========================================================================== */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const C = window.MSE_CONTENT || {};
  const S = window.MSE_SETTINGS || {};
  const DB = window.MSE_DB;
  const CARS = DB ? DB.getCars().filter(c => c.status !== "draft") : (window.MSE_CARS || []);
  const esc = (s) => String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  /* ---- text injection ---- */
  const byPath = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
  $$("[data-c]").forEach((el) => {
    const v = byPath(C, el.dataset.c);
    if (typeof v === "string") el.textContent = v;
  });

  /* ---- header scroll ---- */
  const hdr = $(".hdr");
  window.addEventListener("scroll", () => hdr && hdr.classList.toggle("scrolled", window.scrollY > 20), { passive: true });

  /* ---- reveal ---- */
  const io = new IntersectionObserver(
    (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
    { threshold: 0.1 }
  );
  $$(".reveal:not(.in)").forEach((el) => io.observe(el));

  /* ---- placeholder photos ---- */
  const PHOTOS = [
    "1503376780353-7e6692767b70","1555215695-3004980ad54e","1583121274602-3e2820c69888",
    "1606664515524-ed2f786a0bd6","1494976388531-d1058494cdd8","1568605117036-5fe5e7bab0b7",
    "1517994112540-009c47ea476b","1605559424843-9e4c228bf1c2","1502877338535-766e1452684a",
    "1580273916550-e323be2ae537","1552519507-da3b142c6e3d","1542362567-b07e54358753",
  ];
  const photoAt = (i) => `https://images.unsplash.com/photo-${PHOTOS[i % PHOTOS.length]}?auto=format&fit=crop&w=720&q=72`;

  /* ---- car card ---- */
  const carCard = (c, extra = "", i = 0) => `
    <a class="car ${extra}" href="car-detail.html?id=${esc(c.id)}">
      <div class="cimg">
        ${c.featured ? '<span class="cbadge featured">Öne Çıkan</span>' : ""}
        <button class="fav" aria-label="Favori" onclick="event.preventDefault()">♡</button>
        <img src="${c.images && c.images[0] ? esc(c.images[0]) : photoAt(i)}" alt="${esc(c.title)}" loading="lazy" />
      </div>
      <div class="cbody">
        <h3>${esc(c.title)}</h3>
        <div class="spec-row">
          <div class="spec-cell"><b>${esc(c.year || "—")}</b><span>Yıl</span></div>
          <div class="spec-cell"><b>${esc(c.km || "—")}</b><span>km</span></div>
          <div class="spec-cell"><b>${esc(c.fuel || "—")}</b><span>Yakıt</span></div>
          <div class="spec-cell"><b>${esc(c.transmission || "—")}</b><span>Vites</span></div>
        </div>
        <div class="crow">
          <div class="cprice">${esc(c.price || "—")}</div>
          <span class="clink">İncele <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
        </div>
        ${S.address ? `<div class="caddr">📍 ${esc(S.address)}</div>` : ""}
      </div>
    </a>`;

  const skelCard = (extra = "", i = 0) => `
    <div class="car ${extra}" style="pointer-events:none">
      <div class="cimg"><img src="${photoAt(i)}" alt="Araç" loading="lazy" /></div>
      <div class="cbody">
        <h3 style="color:var(--ink-3)">Araç modeli</h3>
        <div class="spec-row">
          <div class="spec-cell"><b>—</b><span>Yıl</span></div>
          <div class="spec-cell"><b>—</b><span>km</span></div>
          <div class="spec-cell"><b>—</b><span>Yakıt</span></div>
          <div class="spec-cell"><b>—</b><span>Vites</span></div>
        </div>
        <div class="crow">
          <div class="cprice empty">Fiyat panelden</div>
          <span class="clink" style="color:var(--ink-3)">İncele</span>
        </div>
      </div>
    </div>`;

  /* ---- vitrine ---- */
  const track = $("#vitrineTrack");
  if (track) {
    const html = CARS.length
      ? CARS.slice(0,8).map((c,i) => carCard(c,"vcard",i)).join("")
      : Array.from({length:5},(_,i) => skelCard("vcard",i)).join("");
    track.innerHTML = html + html;
  }

  /* ---- cars grid ---- */
  const grid = $("#carsGrid");
  const emptyBanner = $("#emptyState");
  if (grid) {
    if (CARS.length) {
      if (emptyBanner) emptyBanner.style.display = "none";
      grid.innerHTML = CARS.slice(0,6).map((c,i) => carCard(c,"reveal",i)).join("");
      $$(".reveal:not(.in)").forEach((el) => io.observe(el));
    } else {
      grid.innerHTML = Array.from({length:3},(_,i) => skelCard("reveal",i)).join("");
      $$(".reveal:not(.in)").forEach((el) => io.observe(el));
    }
    grid.addEventListener("click", (e) => {
      const f = e.target.closest(".fav");
      if (f) { e.preventDefault(); const on = f.textContent.trim() === "♡"; f.textContent = on ? "♥" : "♡"; f.style.color = on ? "#ef4444" : ""; }
    });
  }

  /* ---- mobile drawer ---- */
  const drawer = $("#drawer");
  $("#burger") && $("#burger").addEventListener("click", () => drawer && drawer.classList.add("open"));
  $("#drawerClose") && $("#drawerClose").addEventListener("click", () => drawer && drawer.classList.remove("open"));
  $$(".drawer nav a").forEach((a) => a.addEventListener("click", () => drawer && drawer.classList.remove("open")));

  /* ========================================================================
     AI ASSISTANT
     ======================================================================== */
  const AI_C = C.assistant || {};
  window.MSE_AI = window.MSE_AI || {};

  const history = [];
  function localAnswer(q) {
    const t = q.toLowerCase();
    if (/(sat|değerle|degerle|nakit|aracım|aracimi)/.test(t))
      return "Aracınızı değerinde nakit alıyoruz. Marka, model, yıl, km ve birkaç fotoğraf paylaşırsanız değerleme talebinizi oluşturayım.";
    if (/(randevu|gel|ziyaret|test|görmek)/.test(t))
      return `Randevu oluşturayım. Adınız, telefonunuz ve uygun gününüzü yazın. 📍 ${S.address || ""} · 🕒 ${S.hours || ""}`;
    if (/(takas)/.test(t))
      return "Takas seçeneğimiz mevcuttur. Mevcut aracınızın bilgilerini paylaşın, değerleme yapalım.";
    if (/(adres|nerede|konum|telefon|iletişim|saat|açık)/.test(t))
      return `📞 ${S.phone || "—"}<br>📍 ${S.address || "—"}<br>🕒 ${S.hours || "—"}`;
    if (/(fiyat|araç|araba|model|öner|ara|satılık)/.test(t)) {
      if (CARS.length) {
        const top = CARS.slice(0,3).map(c => `• ${c.title} — ${c.price}`).join("<br>");
        return `Birkaç seçenek:<br>${top}<br><br>Marka veya bütçe söylerseniz daraltayım.`;
      }
      return "Stok bilgisi admin panelinden güncellenmektedir. Aradığınız marka ve bütçeyi yazarsanız ekleme yapıldıkça size en uygununu önerebilirim.";
    }
    return "Size satılık araçlar, takas, randevu ve aracınızı sattırma konularında yardımcı olabilirim. Ne yapmak istersiniz?";
  }

  window.MSE_AI.ask = async function(q) {
    history.push({role:"user",content:q});
    const apiBase = window.MSE_API_BASE;
    const groqKey = window.MSE_GROQ_KEY || localStorage.getItem("mse_groq_key");
    if (apiBase && apiBase !== "https://mse-auto-api.onrender.com") {
      try {
        const r = await fetch(apiBase + "/api/chat", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({message:q, history:history.slice(-6)}),
        });
        if (r.ok) { const d = await r.json(); history.push({role:"assistant",content:d.reply}); return d.reply; }
      } catch(_){}
    }
    if (groqKey) {
      try {
        const msgs = [
          {role:"system",content:`Sen MSE Auto'nun yapay zeka asistanısın. MSE Auto güvenilir bir 2. el araç alım-satım galerisidir. Türkçe, kısa ve yardımsever cevap ver. Uydurma fiyat verme.`},
          ...history.slice(-6).map(h => ({role:h.role,content:h.content})),
        ];
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions",{
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":"Bearer "+groqKey},
          body:JSON.stringify({model:"llama-3.3-70b-versatile",messages:msgs,max_tokens:512,temperature:0.7}),
        });
        if (r.ok) { const d = await r.json(); const reply = d.choices[0].message.content; history.push({role:"assistant",content:reply}); return reply; }
      } catch(_){}
    }
    await new Promise(r => setTimeout(r, 600));
    const reply = localAnswer(q);
    history.push({role:"assistant",content:reply});
    return reply;
  };

  const orb = $("#aiOrb"), panel = $("#aiPanel"), body = $("#aiBody"), input = $("#aiInput"), hint = $("#aiHint");
  if (body && AI_C.greeting) body.innerHTML = `<div class="msg bot">${AI_C.greeting}</div>`;
  const chipsWrap = $("#aiChips");
  if (chipsWrap && AI_C.chips) chipsWrap.innerHTML = AI_C.chips.map(c => `<button data-q="${esc(c.q)}">${esc(c.label)}</button>`).join("");

  const toggle = (open) => { panel && panel.classList.toggle("open", open); if (open && hint) hint.style.display = "none"; };
  orb && orb.addEventListener("click", () => toggle(!panel.classList.contains("open")));
  $("#aiClose") && $("#aiClose").addEventListener("click", () => toggle(false));

  function addMsg(text, who) { const m = document.createElement("div"); m.className = "msg "+who; m.innerHTML = text; body.appendChild(m); body.scrollTop = body.scrollHeight; return m; }
  function typing() { const t = document.createElement("div"); t.className = "msg bot typing"; t.innerHTML = "<i></i><i></i><i></i>"; body.appendChild(t); body.scrollTop = body.scrollHeight; return t; }
  async function send(q) {
    if (!q || !q.trim()) return;
    addMsg(esc(q), "me"); input.value = "";
    const t = typing();
    const reply = await window.MSE_AI.ask(q);
    t.remove(); addMsg(reply, "bot");
  }
  $("#aiSend") && $("#aiSend").addEventListener("click", () => send(input.value));
  input && input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(input.value); });
  chipsWrap && chipsWrap.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { toggle(true); send(b.dataset.q || b.textContent); } });

})();
