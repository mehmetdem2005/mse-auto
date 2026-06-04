/* ==========================================================================
   MSE AUTO — db.js  |  localStorage-backed veritabanı katmanı
   --------------------------------------------------------------------------
   Tüm veriyi localStorage'da tutar; sayfa yenilenince tekrar yükler.
   Varsayılan değerler site-content.js'den alınır (window.MSE_CONTENT,
   window.MSE_SETTINGS, window.MSE_CARS).
   ========================================================================== */

(function () {
  "use strict";

  /* ── Yardımcı fonksiyonlar ─────────────────────────────────────────── */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function lsGet(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function lsSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("MSE_DB: localStorage yazma hatası —", key, e);
    }
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
      } else {
        out[key] = source[key];
      }
    }
    return out;
  }

  /* ── Varsayılan değerler ───────────────────────────────────────────── */
  var DEFAULT_SETTINGS = {
    phone: "Telefon — panelden ayarlanır",
    whatsapp: "",
    address: "Şube adresi — admin panelinden ayarlanır",
    hours: "Çalışma saatleri — panelden ayarlanır",
    instagram: "",
    facebook: "",
    siteName: "MSE Auto",
    adminUsername: "admin",
    adminPassword: "msauto2024",
  };

  var DEFAULT_CONTENT = window.MSE_CONTENT || {};

  var DEFAULT_AI_CONFIG = {
    features: {
      aracArama: true,
      degerleme: true,
      randevu: true,
      finansman: true,
      sss: true,
    },
    knowledge: [
      {
        id: "kb1",
        q: "Hangi marka araçlara bakıyorsunuz?",
        a: "BMW, Mercedes-Benz, Audi, Volkswagen, Toyota, Honda ve tüm popüler markaları alıp satıyoruz.",
      },
      {
        id: "kb2",
        q: "Değerleme nasıl yapılıyor?",
        a: "Formu doldurmanız yeterli; uzman ekibimiz en kısa sürede sizinle iletişime geçerek ücretsiz değerleme yapar.",
      },
      {
        id: "kb3",
        q: "Takas ve finansman var mı?",
        a: "Evet, takas ve banka finansmanı seçenekleri sunuyoruz. Ayrıntılar için iletişime geçiniz.",
      },
      {
        id: "kb4",
        q: "Randevu nasıl alabilirim?",
        a: "Telefon, WhatsApp veya site üzerindeki form aracılığıyla randevu alabilirsiniz.",
      },
    ],
  };

  /* ── Veri yükleme ──────────────────────────────────────────────────── */
  var _cars = lsGet("mse_cars");
  if (!_cars) {
    _cars = (window.MSE_CARS || []).map(function (c) {
      return Object.assign(
        {
          id: uid(),
          title: "",
          brand: "",
          model: "",
          year: new Date().getFullYear(),
          km: "",
          fuel: "Benzin",
          transmission: "Otomatik",
          color: "",
          price: "",
          description: "",
          features: [],
          images: [],
          model3d: [],
          model3dTitles: [],
          documents: [],
          has3d: false,
          featured: false,
          status: "active",
          createdAt: new Date().toISOString(),
        },
        c
      );
    });
    lsSet("mse_cars", _cars);
  }

  var _settings = lsGet("mse_settings");
  if (!_settings) {
    _settings = Object.assign({}, DEFAULT_SETTINGS, window.MSE_SETTINGS || {});
    lsSet("mse_settings", _settings);
  } else {
    // Eksik anahtarları varsayılanlarla tamamla
    _settings = Object.assign({}, DEFAULT_SETTINGS, _settings);
  }

  var _content = lsGet("mse_content");
  if (!_content) {
    _content = deepMerge({}, DEFAULT_CONTENT);
    lsSet("mse_content", _content);
  }

  var _requests = lsGet("mse_requests") || [];
  var _messages = lsGet("mse_messages") || [];
  var _aiConfig = lsGet("mse_ai_config");
  if (!_aiConfig) {
    _aiConfig = deepMerge({}, DEFAULT_AI_CONFIG);
    lsSet("mse_ai_config", _aiConfig);
  } else {
    // Eksik feature anahtarlarını varsayılanlarla tamamla
    _aiConfig.features = Object.assign(
      {},
      DEFAULT_AI_CONFIG.features,
      _aiConfig.features || {}
    );
    if (!Array.isArray(_aiConfig.knowledge)) {
      _aiConfig.knowledge = DEFAULT_AI_CONFIG.knowledge;
    }
  }

  /* ── Public API ────────────────────────────────────────────────────── */
  var DB = {
    /* ARAÇLAR */
    getCars: function () {
      return _cars.slice();
    },

    getCar: function (id) {
      return _cars.find(function (c) { return c.id === id; }) || null;
    },

    saveCar: function (car) {
      var now = new Date().toISOString();
      var idx = _cars.findIndex(function (c) { return c.id === car.id; });
      if (idx === -1) {
        // Yeni araba
        var newCar = Object.assign(
          {
            id: uid(),
            title: "",
            brand: "",
            model: "",
            year: new Date().getFullYear(),
            km: "",
            fuel: "Benzin",
            transmission: "Otomatik",
            color: "",
            price: "",
            description: "",
            features: [],
            images: [],
            model3d: [],
            model3dTitles: [],
            documents: [],
            has3d: false,
            featured: false,
            status: "active",
            createdAt: now,
          },
          car
        );
        if (!newCar.id || newCar.id === car.id) {
          // id yoktu, yeni atandı
        }
        _cars.unshift(newCar);
        lsSet("mse_cars", _cars);
        return newCar;
      } else {
        _cars[idx] = Object.assign({}, _cars[idx], car);
        lsSet("mse_cars", _cars);
        return _cars[idx];
      }
    },

    deleteCar: function (id) {
      _cars = _cars.filter(function (c) { return c.id !== id; });
      lsSet("mse_cars", _cars);
    },

    /* AYARLAR */
    getSettings: function () {
      return Object.assign({}, _settings);
    },

    saveSettings: function (settings) {
      _settings = Object.assign({}, _settings, settings);
      lsSet("mse_settings", _settings);
      // Global'i güncelle
      if (window.MSE_SETTINGS) {
        Object.assign(window.MSE_SETTINGS, _settings);
      }
    },

    /* İÇERİK */
    getContent: function () {
      return deepMerge({}, _content);
    },

    saveContent: function (content) {
      _content = deepMerge(_content, content);
      lsSet("mse_content", _content);
      if (window.MSE_CONTENT) {
        window.MSE_CONTENT = deepMerge(window.MSE_CONTENT, content);
      }
    },

    /* DEĞERLEME TALEPLERİ */
    getRequests: function () {
      return _requests.slice();
    },

    addRequest: function (req) {
      var newReq = Object.assign(
        {
          id: uid(),
          date: new Date().toISOString(),
          status: "new",
        },
        req
      );
      _requests.unshift(newReq);
      lsSet("mse_requests", _requests);
      return newReq;
    },

    updateRequest: function (id, updates) {
      var idx = _requests.findIndex(function (r) { return r.id === id; });
      if (idx !== -1) {
        _requests[idx] = Object.assign({}, _requests[idx], updates);
        lsSet("mse_requests", _requests);
        return _requests[idx];
      }
      return null;
    },

    deleteRequest: function (id) {
      _requests = _requests.filter(function (r) { return r.id !== id; });
      lsSet("mse_requests", _requests);
    },

    /* MESAJLAR */
    getMessages: function () {
      return _messages.slice();
    },

    addMessage: function (msg) {
      var newMsg = Object.assign(
        {
          id: uid(),
          date: new Date().toISOString(),
          read: false,
        },
        msg
      );
      _messages.unshift(newMsg);
      lsSet("mse_messages", _messages);
      return newMsg;
    },

    updateMessage: function (id, updates) {
      var idx = _messages.findIndex(function (m) { return m.id === id; });
      if (idx !== -1) {
        _messages[idx] = Object.assign({}, _messages[idx], updates);
        lsSet("mse_messages", _messages);
        return _messages[idx];
      }
      return null;
    },

    deleteMessage: function (id) {
      _messages = _messages.filter(function (m) { return m.id !== id; });
      lsSet("mse_messages", _messages);
    },

    /* AI YAPILANDIRMASI */
    getAIConfig: function () {
      return {
        features: Object.assign({}, _aiConfig.features),
        knowledge: (_aiConfig.knowledge || []).map(function (k) {
          return Object.assign({}, k);
        }),
      };
    },

    saveAIConfig: function (config) {
      if (config.features) {
        _aiConfig.features = Object.assign({}, _aiConfig.features, config.features);
      }
      if (config.knowledge !== undefined) {
        _aiConfig.knowledge = config.knowledge;
      }
      lsSet("mse_ai_config", _aiConfig);
    },

    addKnowledge: function (entry) {
      var newEntry = Object.assign({ id: uid() }, entry);
      _aiConfig.knowledge = _aiConfig.knowledge || [];
      _aiConfig.knowledge.push(newEntry);
      lsSet("mse_ai_config", _aiConfig);
      return newEntry;
    },

    updateKnowledge: function (id, updates) {
      var idx = (_aiConfig.knowledge || []).findIndex(function (k) { return k.id === id; });
      if (idx !== -1) {
        _aiConfig.knowledge[idx] = Object.assign({}, _aiConfig.knowledge[idx], updates);
        lsSet("mse_ai_config", _aiConfig);
        return _aiConfig.knowledge[idx];
      }
      return null;
    },

    deleteKnowledge: function (id) {
      _aiConfig.knowledge = (_aiConfig.knowledge || []).filter(function (k) { return k.id !== id; });
      lsSet("mse_ai_config", _aiConfig);
    },

    /* SIFIRLAMA */
    reset: function () {
      ["mse_cars", "mse_settings", "mse_content", "mse_requests", "mse_messages", "mse_ai_config"].forEach(function (k) {
        localStorage.removeItem(k);
      });
      location.reload();
    },
  };

  window.MSE_DB = DB;
})();
