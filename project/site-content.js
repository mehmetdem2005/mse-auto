/* ==========================================================================
   MSE AUTO — Site İçeriği
   Tüm yazılar admin panelinden yönetilir. Hiçbir metin sayfaya sabit yazılmaz.
   ========================================================================== */

window.MSE_CONTENT = {
  meta: {
    title: "MSE Auto — 2. El Araç Alım & Satım",
    desc:  "Güvenilir 2. el araç alım ve satım. Aracınızı değerinde nakde çevirin.",
  },

  hero: {
    kicker:    "Performans · Prestij · Güven",
    title:     "Size Uygun",
    titleEm:   "Aracı",
    titleRest: "Bulun",
    sub:       "En kaliteli markalar, en uygun modeller ve size özel çözümlerle hayalinizdeki araca bir adım daha yakınsınız.",
    primary:   "Araçları Keşfet",
    secondary: "Tanıtım Videosu",
  },

  trust: {
    "1": "Şeffaf ekspertiz",
    "2": "Anında nakit ödeme",
    "3": "Yerinde hizmet",
  },

  vitrine: { kicker: "Öne Çıkanlar", title: "Vitrindeki araçlar", link: "Tüm araçlar" },
  gallery: { kicker: "Öne Çıkanlar", title: "Öne Çıkan Araçlar",  link: "Tüm Araçları Gör" },

  stats: {
    s1: { val: "8+",     label: "Marka"          },
    s2: { val: "500+",   label: "Satılan Araç"    },
    s3: { val: "1.000+", label: "Mutlu Müşteri"   },
    s4: { val: "10+",    label: "Yıl Deneyim"     },
  },

  services: {
    kicker: "Hizmetlerimiz",
    title:  "Güvenle alın, değerinde satın.",
  },

  features: [
    { title: "Kapsamlı Ekspertiz",   desc: "Satın almadan önce aracınız uzman ekibimiz tarafından detaylı incelenir." },
    { title: "Takas Desteği",         desc: "Mevcut aracınızı takas ederek yeni aracınıza kolayca geçiş yapın." },
    { title: "7/24 Destek",           desc: "Sorularınız için her zaman yanınızdayız. Dilediğiniz zaman bize ulaşın." },
  ],

  sell: {
    kicker: "Aracını Sat",
    title:  "Aracınız değerinde, anında nakit.",
    sub:    "Birkaç bilgi ve fotoğrafla başvurun; ekibimiz değerlemeyi yapsın, anlaşınca ödemeyi yerinde gerçekleştirelim.",
    cta:    "Ücretsiz Değerleme Al",
    steps: [
      { t: "Bilgileri gönder", s: "Marka, model, km ve fotoğraf" },
      { t: "Değerleme al",     s: "Ekibimiz en kısa sürede döner" },
      { t: "Anında nakit",     s: "Anlaşınca yerinde ödeme"       },
    ],
  },

  cta: {
    kicker:    "Güvenilir Hizmet",
    title:     "Almak da satmak da MSE Auto ile güvende.",
    sub:       "Şeffaf ekspertiz, eksiksiz belge ve değerinde fiyat. Aklınıza takılanı asistana sorun ya da bize ulaşın.",
    primary:   "Araçları Gör",
    secondary: "İletişime Geç",
  },

  footer: {
    about: "Güvenilir 2. el araç alım & satım. Aracınızı değerinde nakde çevirin, hayalinizdeki aracı güvenle alın.",
  },

  assistant: {
    name:     "MSE Asistan",
    status:   "Çevrimiçi · AI destekli",
    hint:     "Size nasıl yardımcı olabilirim?",
    greeting: "Merhaba! 👋 MSE Auto asistanıyım. Satılık araçlar, fiyatlar, takas, randevu ve aracınızı sattırma konularında yardımcı olabilirim.",
    chips: [
      { label: "Araç öner",   q: "Bana uygun araç önerir misin?" },
      { label: "Aracımı sat", q: "Aracımı sattırmak istiyorum"   },
      { label: "Takas",       q: "Takas seçeneğiniz var mı?"     },
      { label: "Randevu al",  q: "Randevu almak istiyorum"       },
    ],
  },

  /* ── İç sayfa içerikleri ── */
  gallery_page: {
    kicker: "Araçlar",
    title:  "Size Uygun Aracı Bulun",
    sub:    "Tüm araçlarımız ekspertizden geçmiştir.",
  },

  about: {
    kicker: "Hakkımızda",
    title:  "Yolculuğunuz Sizinle Anlam Kazanıyor.",
    sub:    "MSE Auto olarak müşterilerimize güvenli, şeffaf ve değerinde araç alım-satım hizmeti sunuyoruz.",
    story:  "Yılların deneyimiyle büyüyen MSE Auto, her müşterisine bireysel ilgi ve şeffaf hizmet sunmayı ilke edinmiştir.",
  },

  contact: {
    kicker: "İletişim",
    title:  "Sizinle İletişime Geçmekten Mutluluk Duyarız.",
    sub:    "Sorularınız, araç inceleme talepleri veya değerleme için bize ulaşın.",
  },

  sell_page: {
    kicker: "Aracını Sat",
    title:  "Aracınızı Değerinde Satın",
    sub:    "Hızlı, güvenli ve şeffaf bir satış deneyimi.",
  },
};

window.MSE_SETTINGS = {
  phone:     "Telefon — panelden ayarlanır",
  whatsapp:  "",
  address:   "Şube adresi — admin panelinden ayarlanır",
  hours:     "Çalışma saatleri — panelden ayarlanır",
  instagram: "",
};

window.MSE_CARS = [];
