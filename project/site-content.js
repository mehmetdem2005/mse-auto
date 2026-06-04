/* ==========================================================================
   MSE AUTO — SİTE İÇERİĞİ (admin panelinin yöneteceği yapı)
   --------------------------------------------------------------------------
   Buradaki HER ALAN admin panelinden düzenlenebilir olacak (slogan, başlık,
   metin, iletişim, çalışma saatleri, sosyal vb). Üretimde Supabase'teki
   `content` tablosundan /api/content ile gelir. Hiçbir metin sayfaya sabit
   yazılmaz; tamamı buradan basılır.

   ARAÇLAR: gerçek ilanlar admin panelinden eklenecek (Supabase `cars`).
   Aşağıdaki dizi BOŞ — uydurma araç/fiyat/km YOKTUR. Boşken arayüz
   "panelden eklenir" iskelet/boş durumu gösterir.
   ========================================================================== */

window.MSE_CONTENT = {
  brand: { name: "MSE", dot: ".", sub: "AUTO" },

  nav: [
    { label: "Araçlar", href: "#araclar" },
    { label: "Aracını Sat", href: "#sat" },
    { label: "Hakkımızda", href: "#hakkimizda" },
    { label: "Blog", href: "#blog" },
    { label: "İletişim", href: "#iletisim" },
  ],
  ctaPrimary: { label: "Ücretsiz Değerleme", href: "#sat" },
  callLabel: "Hemen Ara",

  hero: {
    kicker: "MSE Auto · 2. El Galeri",
    title: "Doğru araç, doğru fiyatla.",          // slogan — panelden düzenlenir
    sub: "Aramak da satmak da kolay. Araçları yüksek çözünürlüklü ve 3D görünümle inceleyin ya da aracınızı değerinde nakde çevirin.",
    primary: { label: "Satılık Araçlar", href: "#araclar" },
    secondary: { label: "Aracımı Sat", href: "#sat" },
  },

  // Sayı/istatistik YOK — yalnızca hizmet vaatleri (panelden düzenlenir)
  features: [
    { title: "Hızlı Değerleme", desc: "Aracınız için net ve şeffaf teklif." },
    { title: "Anında Nakit", desc: "Anlaşınca ödeme yerinde yapılır." },
    { title: "Güvenilir İşlem", desc: "Eksiksiz ekspertiz ve belge." },
    { title: "Yerinde Hizmet", desc: "Talebe göre adresinize geliriz." },
  ],

  vitrine: { kicker: "Öne Çıkanlar", title: "Vitrindeki araçlar", link: "Tüm araçlar" },
  gallery: { kicker: "Galeri", title: "Satılık araçlar", link: "Galeriye git" },

  sell: {
    kicker: "Aracını Sat",
    title: "Aracınız değerinde, anında nakit.",
    sub: "Birkaç bilgi ve fotoğrafla başvurun; ekibimiz değerlemeyi yapsın, anlaşınca ödemeyi yerinde gerçekleştirelim.",
    cta: "Ücretsiz Değerleme Al",
    steps: [
      { t: "Bilgileri gönder", s: "Marka, model, km ve fotoğraf" },
      { t: "Değerleme al", s: "Ekibimiz en kısa sürede döner" },
      { t: "Anında nakit", s: "Anlaşınca yerinde ödeme" },
    ],
  },

  cta: {
    kicker: "Güvenilir Hizmet",
    title: "Almak da satmak da MSE Auto ile güvende.",
    sub: "Şeffaf ekspertiz, eksiksiz belge ve değerinde fiyat. Aklınıza takılanı asistana sorun ya da bize ulaşın.",
    primary: { label: "Araçları Gör", href: "#araclar" },
    secondary: { label: "İletişime Geç", href: "#iletisim" },
  },

  footer: {
    about: "Güvenilir 2. el araç alım & satım. Aracınızı değerinde nakde çevirin, hayalinizdeki aracı güvenle alın.",
    cols: [
      { h: "Keşfet", items: ["Satılık Araçlar", "Aracını Sat", "Hakkımızda", "Blog & Haberler"] },
      { h: "Kurumsal", items: ["Sık Sorulan Sorular", "Finansman & Takas", "Gizlilik Politikası", "KVKK"] },
    ],
  },

  assistant: {
    name: "MSE Asistan",
    status: "Çevrimiçi · Groq destekli",
    hint: "Size nasıl yardımcı olabilirim?",
    greeting: "Merhaba! 👋 MSE Auto asistanıyım. Satılık araçlar, fiyatlar, takas/finansman, randevu ve aracınızı sattırma konularında yardımcı olabilirim.",
    chips: [
      { label: "Araç öner", q: "Bana uygun araç önerir misin?" },
      { label: "Aracımı sat", q: "Aracımı sattırmak istiyorum" },
      { label: "Takas / finansman", q: "Takas ve finansman var mı?" },
      { label: "Randevu", q: "Randevu almak istiyorum" },
    ],
  },
};

/* İletişim — admin panelinden TEK yerden ayarlanır, her yere otomatik gelir.
   Şu an gerçek bilgi yok; panelden girilince burası dolacak. */
window.MSE_SETTINGS = {
  phone: "Telefon — panelden ayarlanır",
  whatsapp: "",
  address: "Şube adresi — admin panelinden ayarlanır",
  hours: "Çalışma saatleri — panelden ayarlanır",
  instagram: "",
};

/* Gerçek ilanlar buraya panelden gelecek. Şu an BOŞ (uydurma veri yok). */
window.MSE_CARS = [];
