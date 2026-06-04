/* ==========================================================================
   MSE AUTO — API Yapılandırması
   Bu dosyayı admin panelinden ya da doğrudan düzenleyerek ayarlayın.
   Değerler localStorage'a da kaydedilebilir.
   ========================================================================== */

(function () {
  // Backend API URL — Render'a deploy ettikten sonra buraya girin
  // Örn: "https://mse-auto-api.onrender.com"
  var stored_api = localStorage.getItem("mse_api_base");
  window.MSE_API_BASE = stored_api || "https://mse-auto-api.onrender.com";

  // Groq API Key — admin panelinden ayarlanır, localStorage'a kaydedilir
  // UYARI: Frontend'de kullanılırsa herkese açık olur.
  // Üretimde Render backend'i kullanın.
  var stored_groq = localStorage.getItem("mse_groq_key");
  window.MSE_GROQ_KEY = stored_groq || "";

  // Supabase — opsiyonel (şu an localStorage tabanlı db.js kullanılıyor)
  var stored_sb_url = localStorage.getItem("mse_sb_url");
  var stored_sb_anon = localStorage.getItem("mse_sb_anon");
  window.MSE_SUPABASE_URL = stored_sb_url || "";
  window.MSE_SUPABASE_ANON = stored_sb_anon || "";
})();
