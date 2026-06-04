/* ==========================================================================
   MSE AUTO — shared-init.js
   --------------------------------------------------------------------------
   Her sayfada çalışır. MSE_DB'den veri çekip DOM'u günceller,
   form gönderimlerini yakalar, aktif nav öğesini işaretler.
   ========================================================================== */

(function () {
  "use strict";

  /* ── DB hazır mı? ──────────────────────────────────────────────────── */
  if (!window.MSE_DB) {
    console.warn("shared-init: MSE_DB bulunamadı; db.js yüklendi mi?");
    return;
  }

  var DB = window.MSE_DB;

  /* ── 1. Global değişkenleri DB verileriyle güncelle ─────────────────── */
  var storedSettings = DB.getSettings();
  var storedContent = DB.getContent();

  window.MSE_SETTINGS = Object.assign({}, window.MSE_SETTINGS || {}, storedSettings);
  if (window.MSE_CONTENT && storedContent) {
    window.MSE_CONTENT = deepMerge(window.MSE_CONTENT, storedContent);
  } else {
    window.MSE_CONTENT = storedContent || window.MSE_CONTENT || {};
  }

  function deepMerge(target, source) {
    var out = Object.assign({}, target);
    for (var key in source) {
      if (
        source[key] !== null &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key]) &&
        typeof target[key] === "object" &&
        target[key] !== null &&
        !Array.isArray(target[key])
      ) {
        out[key] = deepMerge(target[key], source[key]);
      } else if (source[key] !== undefined) {
        out[key] = source[key];
      }
    }
    return out;
  }

  /* ── 2. data-c elementlerini içerikle doldur ───────────────────────── */
  function getNestedValue(obj, path) {
    var parts = path.split(".");
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur === null || cur === undefined) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function updateDataC() {
    var content = window.MSE_CONTENT || {};
    var els = document.querySelectorAll("[data-c]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var path = el.getAttribute("data-c");
      var val = getNestedValue(content, path);
      if (val !== undefined && val !== null && typeof val !== "object") {
        el.textContent = String(val);
      }
    }
  }

  /* ── 3. Footer iletişim bilgilerini güncelle ─────────────────────────── */
  function updateFooter() {
    var s = window.MSE_SETTINGS || {};
    var set = function (id, v) {
      var el = document.getElementById(id);
      if (el && v) el.textContent = v;
    };
    set("footPhone", s.phone);
    set("footAddr", s.address);
    set("footHours", s.hours);

    // WhatsApp linki
    var waLinks = document.querySelectorAll('a[href^="https://wa.me"]');
    if (s.whatsapp) {
      var waNum = s.whatsapp.replace(/\D/g, "");
      waLinks.forEach(function (a) {
        a.href = "https://wa.me/" + waNum;
      });
    }

    // Telefon linkleri
    if (s.phone) {
      var telLinks = document.querySelectorAll('a[href^="tel:"]');
      telLinks.forEach(function (a) {
        a.href = "tel:" + s.phone.replace(/\s/g, "");
      });
    }

    // Instagram linki
    if (s.instagram) {
      var igLinks = document.querySelectorAll('a[aria-label="Instagram"]');
      igLinks.forEach(function (a) {
        a.href = s.instagram;
      });
    }
  }

  /* ── 4. Aktif nav öğesini işaretle ─────────────────────────────────── */
  function markActiveNav() {
    var page = location.pathname.split("/").pop() || "index.html";
    var navLinks = document.querySelectorAll(".nav a, .drawer nav a");
    navLinks.forEach(function (a) {
      var href = a.getAttribute("href") || "";
      // Hem tam URL eşleşmesi hem de hash tabanlı gezinme
      if (href && !href.startsWith("#")) {
        var linkPage = href.split("/").pop();
        if (linkPage === page) {
          a.setAttribute("aria-current", "page");
          a.style.color = "var(--gold, #a87f1d)";
        }
      }
    });
  }

  /* ── 5. "Aracını Sat" form gönderimlerini yakala ────────────────────── */
  function handleSellForms() {
    // Form: id="sellForm" veya data-form="sell" olan formları bul
    var forms = document.querySelectorAll('form[data-form="sell"], #sellForm, .sell-form');
    forms.forEach(function (form) {
      if (form._mseHandled) return;
      form._mseHandled = true;
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var data = new FormData(form);
        var req = {
          name: data.get("name") || form.querySelector('[name="name"]')?.value || "",
          phone: data.get("phone") || form.querySelector('[name="phone"]')?.value || "",
          brand: data.get("brand") || form.querySelector('[name="brand"]')?.value || "",
          model: data.get("model") || form.querySelector('[name="model"]')?.value || "",
          year: data.get("year") || form.querySelector('[name="year"]')?.value || "",
          km: data.get("km") || form.querySelector('[name="km"]')?.value || "",
          note: data.get("note") || form.querySelector('[name="note"]')?.value || "",
          status: "new",
        };

        // Boş alan kontrolü
        if (!req.name && !req.phone) {
          var inputs = form.querySelectorAll("input, textarea, select");
          inputs.forEach(function (inp) {
            if (inp.name) req[inp.name] = inp.value;
          });
        }

        DB.addRequest(req);
        showFormSuccess(form, "Talebiniz alındı! En kısa sürede sizi arayacağız.");
        form.reset();
      });
    });
  }

  /* ── 6. İletişim form gönderimlerini yakala ────────────────────────── */
  function handleContactForms() {
    var forms = document.querySelectorAll('form[data-form="contact"], #contactForm, .contact-form');
    forms.forEach(function (form) {
      if (form._mseHandled) return;
      form._mseHandled = true;
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var data = new FormData(form);
        var msg = {
          name: data.get("name") || form.querySelector('[name="name"]')?.value || "",
          email: data.get("email") || form.querySelector('[name="email"]')?.value || "",
          subject: data.get("subject") || form.querySelector('[name="subject"]')?.value || "İletişim",
          body: data.get("message") || form.querySelector('[name="message"]')?.value || "",
          read: false,
        };

        var inputs = form.querySelectorAll("input, textarea, select");
        inputs.forEach(function (inp) {
          if (inp.name && !msg[inp.name]) msg[inp.name] = inp.value;
        });

        DB.addMessage(msg);
        showFormSuccess(form, "Mesajınız iletildi! En kısa sürede dönüş yapacağız.");
        form.reset();
      });
    });
  }

  /* ── Yardımcı: Form başarı mesajı ───────────────────────────────────── */
  function showFormSuccess(form, text) {
    var existing = form.parentNode.querySelector(".form-success-msg");
    if (existing) existing.remove();

    var div = document.createElement("div");
    div.className = "form-success-msg";
    div.style.cssText =
      "background:rgba(70,209,122,0.12);border:1px solid rgba(70,209,122,0.4);color:#1a5c32;" +
      "padding:12px 18px;border-radius:12px;font-size:14px;font-weight:600;margin-top:12px;" +
      "animation:fadeIn 0.3s ease";
    div.textContent = text;
    form.parentNode.insertBefore(div, form.nextSibling);
    setTimeout(function () {
      div.style.opacity = "0";
      div.style.transition = "opacity 0.5s";
      setTimeout(function () { div.remove(); }, 500);
    }, 4000);
  }

  /* ── DOM hazır olduğunda çalıştır ───────────────────────────────────── */
  function init() {
    updateDataC();
    updateFooter();
    markActiveNav();
    handleSellForms();
    handleContactForms();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
