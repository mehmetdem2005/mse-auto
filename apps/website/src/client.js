// Aşamalı geliştirme — JS yoksa site tamamen çalışır durumda kalır (statik içerik).
// Buradaki her şey süsleme katmanıdır: reveal animasyonu, mobil menü, kopyalama.
(() => {
  const root = document.documentElement;
  root.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Görünüme-girince beliren öğeler (stagger gecikmesi CSS --d değişkeninde)
  const revealed = document.querySelectorAll(".rv");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    for (const el of revealed) el.classList.add("on");
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("on");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );
    for (const el of revealed) io.observe(el);
  }

  // Mobil menü
  const navBtn = document.querySelector(".nav-btn");
  const nav = document.getElementById("nav-menu");
  if (navBtn && nav) {
    navBtn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      navBtn.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        navBtn.setAttribute("aria-expanded", "false");
        navBtn.focus();
      }
    });
  }

  // Örnek cümle kopyalama — başarı durumu butonun kendi metninde + ekran okuyucuya duyurulur
  const live = document.createElement("div");
  live.setAttribute("role", "status");
  live.style.cssText =
    "position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)";
  document.body.appendChild(live);

  for (const btn of document.querySelectorAll(".copy-btn")) {
    btn.addEventListener("click", async () => {
      const text = btn.getAttribute("data-copy") || "";
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        return; // izin yoksa sessizce vazgeç — cümle zaten seçilebilir metin
      }
      const label = btn.querySelector("span");
      const done = btn.getAttribute("data-copied") || "OK";
      if (label && !btn.classList.contains("done")) {
        const prev = label.textContent;
        btn.classList.add("done");
        label.textContent = done;
        live.textContent = done;
        setTimeout(() => {
          btn.classList.remove("done");
          label.textContent = prev;
        }, 1600);
      }
    });
  }
})();

// Edinim sinyali (ADR-091) — KİMLİKSİZ: yalnız yol + yönlendiren alan adı + utm + dil.
// Çerez yok, kimlik yok; DNT'ye saygı duyulur; yerel önizlemede gönderilmez.
(() => {
  const dnt = navigator.doNotTrack === "1";
  const local = ["localhost", "127.0.0.1"].includes(location.hostname);
  if (dnt || local) return;
  const payload = JSON.stringify({
    source: "site",
    path: location.pathname,
    ref: document.referrer || undefined,
    utm: new URLSearchParams(location.search).get("utm_source") || undefined,
    lang: document.documentElement.lang,
  });
  const url = "__API_URL__/t";
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, payload);
  } else {
    void fetch(url, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: payload,
      keepalive: true,
    }).catch(() => undefined);
  }
})();
