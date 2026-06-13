// Türkçe içerik — TEK KAYNAK. İlke (kullanıcı yönergesi): siteyi NE yaptığına odakla,
// NASIL yaptığını açma — yalnız "açık web kaynaklarını belirli aralıklarla tarar" denir;
// iç mekanik/strateji (güven yüzdesi, kanonik sorgu, derin tarama, saha araştırması)
// siteye yazılmaz. Yalnızca GERÇEKTEN erişilebilir senaryolar: giriş/şifre/captcha
// arkasındaki sistemler (vize randevu portalı, MHRS, e-Devlet) dahil edilmez.
// GEO: her sayfa "önce cevap" 40-60 kelimelik bağımsız paragrafla açılır; H2'ler soru
// biçimindedir; sayfa kısadır; örnekler evrensel (ülkeye/kuruma kilitli değil).

/** @typedef {{ q: string, a: string }} Faq */
/** @typedef {{ slug: string, icon: string, name: string, metaTitle: string,
 *   metaDescription: string, h1: string, answer: string, context: string[],
 *   examples: string[], faq: Faq[], related: string[] }} UseCase */

// Global-first (ADR-096): kök dil EN'dir; TR /tr altında tam eşlenik yaşar
// (eski kök TR yolları vercel.json 301'leriyle /tr'ye taşınır — bağlantı kırılmaz).
export const tr = {
  lang: "tr",
  prefix: "/tr",
  useCaseBase: "/tr/cozumler",
  langName: "Türkçe",
  otherLangLabel: "English",

  nav: {
    how: "Nasıl çalışır",
    useCases: "Çözümler",
    compare: "Karşılaştırma",
    faq: "SSS",
    about: "Hakkında",
    openApp: "Uygulamayı aç",
    menuLabel: "Menüyü aç/kapat",
    skip: "İçeriğe atla",
  },

  footer: {
    tagline:
      "Whenly, izlemesini istediğin gelişmeyi senin yerine takip eder ve gerçekleştiğinde haber verir.",
    useCases: "Çözümler",
    product: "Ürün",
    legal: "Hukuki",
    privacy: "Gizlilik Politikası",
    terms: "Kullanım Koşulları",
    contact: "İletişim",
    forAi: "Yapay zekâ asistanları için: llms.txt",
    langSwitch: "English version",
    updated: "İçerik güncellendi",
  },

  home: {
    metaTitle: "Whenly — Şu olunca haber ver: izleme ve bildirim uygulaması",
    metaDescription:
      '"Şu olunca haber ver" de: Whenly açık web kaynaklarını belirli aralıklarla tarar ve gelişme göründüğünde bildirim — istersen alarm — gönderir. Ücretsiz başla.',
    heroOverline: "İzleme ve bildirim uygulaması",
    heroTitle: "Şu olunca <em>haber ver.</em>",
    // Çözümü sat (copywriting skill): ürün özelliği değil, kurtulduğun iş — "yenilemeyi bırak".
    heroSub:
      "Sayfayı yenileyip durma. Beklediğin anı — fiyat düşüşü, stok, ilan, duyuru — tek bir cümleyle Whenly'ye anlat. Açık web kaynaklarını belirli aralıklarla senin yerine kontrol eder; o an geldiğinde telefonunu çaldırır.",
    heroCta: "Ücretsiz izlemeye başla",
    heroCtaNote: "Kredi kartı gerekmez · Web'de ve telefonda çalışır",
    heroSecondary: "Nasıl çalışır?",
    phone: {
      watcherLabel: "İZLENİYOR",
      watcherText: "Beklediğim ürün resmî satıcıda 5.000 TL altına stoğa girince haber ver",
      watcherMeta: "Belirli aralıklarla kontrol",
      notifTitle: "Whenly · şimdi",
      notifText: "Stoğa girdi: ürün belirlediğin fiyatın altında yeniden satışta görünüyor.",
      notifMeta: "Bildirim gönderildi",
    },
    howHeading: "Whenly nasıl çalışır?",
    how: [
      {
        icon: "messageSquare",
        t: "Ne izleyeceğini yaz",
        d: '"Kadıköy\'de 30.000 TL altı kiralık ilan çıkınca haber ver" gibi doğal bir cümle yaz. Form yok, kural ezberi yok.',
      },
      {
        icon: "refresh",
        t: "Whenly takip eder",
        d: "Açık web kaynaklarını (siteler, haberler, duyurular) senin yerine belirli aralıklarla kontrol eder.",
      },
      {
        icon: "bellRing",
        t: "Haber al",
        d: "Aradığın gelişme göründüğünde telefonuna bildirim gelir; kritik konularda alarm moduyla telefon çalar.",
      },
    ],
    // Fayda-önce (copywriting skill: benefits over features) — her madde "sana ne kazandırır".
    featuresHeading: "Sana ne kazandırır",
    features: [
      {
        icon: "zap",
        t: "Tek cümle, kurulumun tamamı",
        d: '"Stokta VE belirlediğim fiyatın altında" gibi birleşik kuralları doğal cümleden anlar. Kural motoru öğrenmek, filtre kurmak yok.',
      },
      {
        icon: "languages",
        t: "Kendi dilinde çalışır",
        d: "Türkçe dahil 11 arayüz dili. İzlemeyi, yüksek sesle söyler gibi yazarsın.",
      },
      {
        icon: "bellRing",
        t: "Kritik anlar için alarm modu",
        d: "Bazı anlar sessiz bildirim tepsisinde bekleyemez: Pro'da uyarı telefonu gerçekten çaldırır.",
      },
      {
        icon: "clock",
        t: "Sessiz saatler, senin şartınla",
        d: "Gece uyarıları sabaha bekler — uykudan feragat etmeden takipte kalırsın.",
      },
      {
        icon: "smartphone",
        t: "Web'de ve telefonda",
        d: "Herhangi bir tarayıcıda bir dakikada başlarsın; Android uygulaması da var. Uyarılar telefona düşer.",
      },
      {
        icon: "shieldCheck",
        t: "Varsayılan olarak gizli",
        d: "Reklam yok, veri satışı yok. İstediğin an her şeyi indirir ya da kalıcı silersin.",
      },
    ],
    pricingHeading: "Fiyatlandırma basit",
    pricing: {
      freeName: "Ücretsiz",
      freeBullets: [
        "3 aktif izleme",
        "Düzenli kontrol",
        "Bildirimler + sessiz saatler",
        "Web ve Android",
      ],
      freeCta: "Ücretsiz başla",
      proName: "Pro",
      proBullets: [
        "100 aktif izleme",
        "Daha sık kontrol",
        "Alarm modu — telefon çalar",
        "Kişiselleştirme + ek seçenekler",
      ],
      proCta: "Uygulamada yükselt",
      note: "Ücretsiz plan süresiz ve kart bilgisi istemez. Pro'ya uygulama içinden geçer, istediğin an iptal edersin.",
    },
    useCasesHeading: "Ne için kullanılıyor?",
    useCasesSub:
      "Whenly'nin açık web'de yaptığı dokuz gerçek iş — her biri eskiden kaçırılan bir an.",
    useCasesAll: "Tüm çözümleri gör",
    faqHeading: "Sık sorulan sorular",
    faq: [
      {
        q: "Whenly nedir?",
        a: 'Whenly, doğal dille tarif ettiğin bir gelişmeyi (örneğin "bu ürün stoğa girince haber ver") senin yerine takip eden bir uygulamadır. Açık web kaynaklarını belirli aralıklarla kontrol eder ve aradığın şey göründüğünde bildirim ya da alarm gönderir.',
      },
      {
        q: "Whenly ücretsiz mi?",
        a: "Evet — ücretsiz planda 3 aktif izleme süresiz kullanılır, kart bilgisi istenmez. Pro plan daha çok izleme, daha sık kontrol ve alarm modu ekler.",
      },
      {
        q: "Hangi kaynakları takip edebilir?",
        a: "Kamuya açık web kaynaklarını: siteler, haber ve duyuru sayfaları, ilanlar. Giriş/şifre gerektiren portallara, kişisel hesaplara ve captcha (robot doğrulaması) arkasındaki sayfalara erişmez — bu sınırı açıkça belirtiyoruz.",
      },
      {
        q: "Ne kadar hızlı haber verir?",
        a: "Whenly kaynakları belirli aralıklarla kontrol eder; gelişmeyi yayımlandıktan sonraki ilk kontrolde yakalar. Saniyesinde haber almayı garanti etmeyiz; kaynaklar geç yayımlayabilir. Bildirimi, kendin doğrulayacağın bir işaret olarak kullan.",
      },
      {
        q: "Verilerim güvende mi?",
        a: "Verini satmayız, reklam için kullanmayız. Ayarlardan tüm verini makinece okunabilir biçimde indirebilir veya hesabınla birlikte kalıcı silebilirsin. Ayrıntılar Gizlilik Politikası'nda.",
      },
      {
        q: "Telefonda mı, web'de mi çalışır?",
        a: "İkisinde de. Web uygulaması her tarayıcıda çalışır; Android uygulaması da vardır. Bildirimler telefona gelir; Pro'da kritik izlemeler için alarm modu vardır.",
      },
      {
        q: "İnternette bir şey olunca bana haber veren bir uygulama var mı?",
        a: 'Whenly\'nin işi tam olarak bu. Olayı tek cümleyle yazarsın — "şu olunca haber ver" — Whenly açık web kaynaklarını belirli aralıklarla kontrol eder; gerçekleştiğinde bildirim gönderir ya da alarm çaldırır.',
      },
      {
        q: "Whenly web'i benim yerime izleyen bir yapay zekâ uygulaması mı?",
        a: "Evet. Whenly doğal cümleni izleme niyetine çevirmek ve bulduğunun gerçekten tarif ettiğin olay olup olmadığına karar vermek için yapay zekâ kullanır. Yalnız açık sayfaları okur — hesaplara giriş yapmaz — ve zamanlama anlık değil, düzenli kontroldür.",
      },
    ],
    ctaHeading: "Yenile tuşunu bırak",
    ctaText: "Bir cümle yaz, nöbeti devret. Bir dahaki sefere ilk öğrenen sen ol.",
  },

  useCasesIndex: {
    slug: "cozumler",
    metaTitle: "Whenly çözümleri — neyi izleyebilirsin?",
    metaDescription:
      "Fiyat ve stoktan ilanlara, ihaleden mevzuata: Whenly'nin açık web üzerinde takip edebildiği izleme senaryoları.",
    h1: "Neyi izleyebilirsin?",
    intro:
      "Whenly konu-bazlı çalışır: bir sayfa adresi vermek zorunda değilsin, ne olmasını beklediğini anlatırsın. Aşağıdakilerin hepsi kamuya açık web kaynaklarında takip edilebilir.",
  },

  /** @type {UseCase[]} */
  useCases: [
    {
      slug: "fiyat-takibi",
      icon: "trendingDown",
      name: "Fiyat takibi",
      metaTitle: "Fiyat düşünce haber veren uygulama (ürün, uçak, kripto) — Whenly",
      metaDescription:
        "Belirlediğin eşiğin altına inince haber al: e-ticaret ürünleri, uçak bileti, otel, kripto ve döviz. Whenly eşik kurallarını doğal dilden anlar. Ücretsiz başla.",
      h1: "Fiyat eşiğin altına inince haber al",
      answer:
        'Whenly, bir ürünün, uçak biletinin veya varlığın kamuya açık fiyatını senin belirlediğin eşiğe göre takip eder; eşik aşıldığında bildirim gönderir. "Şu ürün 12.000 TL altına inince haber ver" gibi tek cümleyle kurulur; düşüş de yükseliş de izlenebilir.',
      context: [
        "Fiyat alarmı kurmadan indirimleri ve fırsatları yakalamak elle takip gerektirir; iyi fırsatlar saatler içinde kapanır.",
        "Uçak ve otel fiyatları sık değişir; eşiğe yaklaşan fiyatı sürekli kontrol etmek zaman alır.",
        'Kripto ve dövizde "fark ettiğimde geçmişti" sık yaşanır; eşik bildirimi bu işi senin yerine yapar.',
      ],
      examples: [
        "Şu ürün herhangi bir büyük e-ticaret sitesinde 12.000 TL altına inince haber ver.",
        "İstanbul–Bangkok uçak bileti 8.000 TL altına düşünce bildir.",
        "Bitcoin 1.500.000 TL üstüne çıkınca haber ver.",
      ],
      faq: [
        {
          q: "Hangi fiyatlar izlenebilir?",
          a: "Kamuya açık fiyat gösteren her şey: e-ticaret ürünleri, uçak/otel fiyatları, kripto ve döviz kurları. Eşik kuralını doğal dille verirsin.",
        },
        {
          q: "Sürekli mi kontrol ediyor?",
          a: "Belirli aralıklarla kontrol eder. Oynak ve eşiğe yakın fiyatlar için daha sık kontrol, Pro'nun tipik kullanım nedenidir.",
        },
      ],
      related: ["stok-takibi", "kiralik-ev-ilan-takibi", "bilet-takibi"],
    },
    {
      slug: "stok-takibi",
      icon: "pkg",
      name: "Stok / restock takibi",
      metaTitle: "Stoğa girince haber veren uygulama (PS5, ekran kartı) — Whenly",
      metaDescription:
        'PS5, ekran kartı veya sneaker stoğa girince haber al. Whenly açık satış sayfalarını takip eder; "stokta VE fiyat altı" bileşik koşullarını anlar. Ücretsiz başla.',
      h1: "Ürün stoğa girince haber al",
      answer:
        'Whenly, ürün satış ve duyuru sayfalarını senin yerine takip eder; ürün resmî satıcıda yeniden satışa sunulduğunda bildirim gönderir. Farkı bileşik koşullardır: "stoğa girince VE şu fiyatın altındaysa" gibi kuralları doğal dilden anlar.',
      context: [
        "Popüler ürünlerin yeniden stoğu hızlı kapanır; sayfayı elle yenileyen çoğu zaman kaçırır.",
        "Birden çok satıcıyı aynı anda takip etmek zaman alır; Whenly bunu senin yerine yapar.",
        "Sadece stok değil, stok + fiyat koşulunu birlikte izlemek basit alarmların yapamadığı şeydir.",
      ],
      examples: [
        "PS5 resmî satıcıda stoğa girince haber ver.",
        "RTX 5090 ekran kartı 65.000 TL altına stoğa girince haber ver.",
        "Şu sneaker retail fiyatına yeniden satışa çıkınca bildir.",
      ],
      faq: [
        {
          q: "Hangi mağazalar izlenebilir?",
          a: 'Kamuya açık ürün ve duyuru sayfası olan her satıcı. Whenly konu-bazlı çalıştığı için tek bir sayfa adresine bağlı kalmazsın: "resmî satıcıda" dersin, açık web\'deki satış sinyallerini birlikte değerlendirir.',
        },
        {
          q: "Fiyat koşulunu da aynı anda kontrol edebilir mi?",
          a: 'Evet — bileşik koşullar Whenly\'nin çekirdek özelliği: "stokta VE şu fiyatın altında" tek izlemede tanımlanır.',
        },
      ],
      related: ["fiyat-takibi", "bilet-takibi", "duyuru-takibi"],
    },
    {
      slug: "kiralik-ev-ilan-takibi",
      icon: "home",
      name: "Kiralık ev ilanı takibi",
      metaTitle: "Yeni kiralık ilan çıkınca haber veren uygulama — Whenly",
      metaDescription:
        "İyi kiralık ilanlar saatler içinde gidiyor. Whenly bölge, fiyat ve oda kriterlerine uyan yeni ilanları takip eder, yayınlandığında haber verir. Doğal dille kur.",
      h1: "Kriterine uyan kiralık ilan çıkınca haber al",
      answer:
        'Whenly, kamuya açık emlak ilan kaynaklarını bölge, fiyat ve oda sayısı gibi kriterlerine göre senin yerine takip eder; uyan yeni ilan yayımlandığında bildirim gönderir. "Kadıköy\'de 2+1, 30.000 TL altı kiralık ilan çıkınca haber ver" — kurulum bu kadar.',
      context: [
        "Makul fiyatlı ilanlar çoğu zaman aynı gün kapanır; ilk görenler avantajlı olur.",
        "İlan sitelerinin kendi bildirimleri gecikebilir veya kriter esnekliği sınırlı kalır.",
        "Birden çok semti ve koşulu elle taramak her gün saatler alır.",
      ],
      examples: [
        "Kadıköy'de 2+1, 30.000 TL altı yeni kiralık ilan çıkınca haber ver.",
        "Beşiktaş veya Şişli'de eşyalı 1+1 kiralık ilan yayımlanınca bildir.",
        "Ankara Çankaya'da 5 milyon TL altı satılık 3+1 ilanı çıkınca haber ver.",
      ],
      faq: [
        {
          q: "Hangi ilan siteleri izleniyor?",
          a: "Kamuya açık ilan yayımlayan kaynaklar. Whenly konu-bazlıdır: tek siteye kilitlenmek yerine kriterine uyan açık ilan sinyallerini birlikte değerlendirir.",
        },
        {
          q: "Bölge ve fiyatı aynı anda süzebilir mi?",
          a: "Evet — semt + fiyat üst sınırı + oda sayısı tek cümlede tanımlanır.",
        },
      ],
      related: ["fiyat-takibi", "ihale-takibi", "duyuru-takibi"],
    },
    {
      slug: "bilet-takibi",
      icon: "ticket",
      name: "Etkinlik bileti takibi",
      metaTitle: "Konser/etkinlik bileti satışa çıkınca haber veren uygulama — Whenly",
      metaDescription:
        "Bilet satış açılışını kaçırma: Whenly konser, maç ve etkinlik biletlerinin satışa çıkış duyurusunu takip eder, açıldığında haber verir.",
      h1: "Bilet satışa çıkınca haber al",
      answer:
        'Whenly, konser ve etkinlik biletlerinin kamuya açık satış açılış duyurularını ve yeni tarih ilanlarını senin yerine takip eder; satış açıldığı duyurulduğunda bildirim — istersen alarm — gönderir. Tarih belli değilse "satışa açılınca haber ver" dersin.',
      context: [
        "Popüler etkinliklerde satış açılış anını kaçıran bilet bulamıyor.",
        "Satış tarihi çoğu zaman önceden net değil; duyuruyu sürekli takip etmek zor.",
        "Yeni tarih veya ek seans duyuruları rastgele anlarda yayımlanıyor.",
      ],
      examples: [
        "Bu sanatçının konseri satışa açıldığı duyurulunca haber ver.",
        "Takip ettiğim etkinliğe ek tarih/seans açıklanınca bildir.",
        "Şu maçın biletleri genel satışa çıktığı duyurulunca haber ver.",
      ],
      faq: [
        {
          q: "Bileti benim yerime alıyor mu?",
          a: "Hayır — Whenly haber verir, satın almayı sen yaparsın. Hesabına erişmez, sıraya senin yerine girmez.",
        },
        {
          q: "Satış tarihi belli değilse işe yarar mı?",
          a: 'Evet — "satışa açılınca haber ver" dersin, kamuya açık duyuru ve satış sayfası sinyallerini takip eder.',
        },
      ],
      related: ["stok-takibi", "fiyat-takibi", "duyuru-takibi"],
    },
    {
      slug: "ihale-takibi",
      icon: "gavel",
      name: "İhale ve RFP takibi",
      metaTitle: "Yeni ihale yayımlanınca haber veren uygulama (EKAP, RFP) — Whenly",
      metaDescription:
        "Kamu ihale ilanları, düzeltmeler ve RFP'ler: kriterine uyan ihale yayımlandığında Whenly haber verir; değişiklikleri ve son teklif tarihlerini de takip eder.",
      h1: "Sektörüne uyan ihale yayımlanınca haber al",
      answer:
        "Whenly, kamuya açık ihale ilanlarını, düzeltme/zeyilname duyurularını ve özel sektör RFP ilanlarını senin yerine takip eder; kriterlerine uyan yeni ilan veya değişiklik yayımlandığında bildirim gönderir.",
      context: [
        "İlanı bulmak kolay, sonraki değişikliği (zeyilname, tarih) kaçırmamak zordur.",
        "Pasif bakılan panolarda yeni ilanlar günler sonra fark edilir; rekabet erken görenindir.",
        "Son teklif tarihini kaçırmak doğrudan elenme demektir.",
      ],
      examples: [
        "İstanbul'da inşaat malzemesi ihalesi yayımlanınca haber ver.",
        "Takip ettiğim ihalede düzeltme veya teklif tarihi değişikliği olursa bildir.",
        "Takip ettiğim RFP'nin son teklif tarihine 48 saat kala hatırlat.",
      ],
      faq: [
        {
          q: "Hesabımla bağlanıyor mu?",
          a: "Hayır — kamuya açık ilan ve duyuru sayfaları takip edilir; giriş gerektiren ekranlara erişilmez. İlan metnine kaynağından kendin ulaşırsın.",
        },
        {
          q: "Son tarih hatırlatması yapar mı?",
          a: 'Evet — "son teklif tarihine 2 gün kala hatırlat" gibi zamana bağlı kurallar tanımlanabilir.',
        },
      ],
      related: ["hibe-destek-takibi", "mevzuat-takibi", "rakip-takibi"],
    },
    {
      slug: "hibe-destek-takibi",
      icon: "coins",
      name: "Hibe ve destek takibi",
      metaTitle: "Hibe çağrısı açılınca haber veren uygulama (KOSGEB, TÜBİTAK) — Whenly",
      metaDescription:
        "Hibe ve destek programlarının çağrı duyurularını Whenly takip eder; çağrı açıldığında ve son başvuru yaklaşınca haber verir. Yılda tek pencereyi kaçırma.",
      h1: "Hibe çağrısı açıldığında haber al",
      answer:
        "Whenly, hibe ve destek programlarının kamuya açık çağrı duyurularını senin yerine takip eder; başvuru penceresi açıldığında ve son tarihe yaklaşıldığında bildirim gönderir. Hangi kaynağa uyuyorsan tek cümleyle tanımlarsın.",
      context: [
        "Bazı çağrılar bütçe dolunca son tarihten önce kapanır; açıldığı an başvurmak en güvenlisidir.",
        "Birçok program yılda yalnız bir kez çağrı açar; kaçıran uzun süre bekler.",
        "Son başvuru gününü kaçırmak çoğu programda doğrudan elenme demektir.",
      ],
      examples: [
        "Ar-Ge destek çağrısı açılınca haber ver.",
        "Yeni mali destek programı duyurulunca bildir.",
        "Takip ettiğim çağrı açıldığında ve son başvuruya 1 hafta kala hatırlat.",
      ],
      faq: [
        {
          q: "Son başvuru hatırlatması yapar mı?",
          a: 'Evet — açılışı ve son tarihi aynı izlemeyle takip edersin: "çağrı açılınca haber ver" + "son başvuruya 1 hafta kala hatırlat".',
        },
        {
          q: "Hangi fon kaynakları izlenebilir?",
          a: "Kamuya açık duyuru yapan her program: ulusal ajanslar, bakanlık destekleri, AB programları, vakıf hibeleri. Sektör ve uygunluk kriterini cümlene eklersin.",
        },
      ],
      related: ["ihale-takibi", "mevzuat-takibi", "duyuru-takibi"],
    },
    {
      slug: "mevzuat-takibi",
      icon: "scale",
      name: "Mevzuat takibi",
      metaTitle: "Resmî Gazete ve mevzuat değişikliğinde haber veren uygulama — Whenly",
      metaDescription:
        "Seni ilgilendiren yönetmelik, tebliğ veya karar yayımlandığında haber al. Whenly Resmî Gazete ve kurum duyurularını takip eder. Uyum riskini azalt.",
      h1: "Seni ilgilendiren mevzuat değişince haber al",
      answer:
        "Whenly, Resmî Gazete'yi ve düzenleyici kurum duyurularını senin tanımladığın konu çerçevesinde takip eder; ilgili yönetmelik, tebliğ veya karar yayımlandığında bildirim gönderir.",
      context: [
        "Resmî Gazete her gün yayımlanır; ilgili tek maddeyi elle ayıklamak sürdürülebilir değildir.",
        "Değişikliği geç fark etmek uyum cezası veya ek maliyet riski doğurur.",
        "Birden çok kurumun duyurusunu aynı anda izlemek zaman alır.",
      ],
      examples: [
        "Resmî Gazete'de sektörümü ilgilendiren yönetmelik yayımlanınca haber ver.",
        "Düzenleyici kurum yeni bir tebliğ veya karar yayımlayınca bildir.",
        "Gümrük tarifesinde ürün grubumu etkileyen değişiklik olursa haber ver.",
      ],
      faq: [
        {
          q: "Hukuki danışmanlık yerine geçer mi?",
          a: "Hayır — Whenly erken-uyarı katmanıdır: değişikliği ilk anda görmeni sağlar, yorumunu uzmanın yapar. Bildirimden kaynağa giderek metni kendin okursun.",
        },
        {
          q: "Yalnız Türkiye mevzuatı mı?",
          a: "Hayır — kamuya açık duyuru yapan her düzenleyici takip edilebilir: AB direktifleri, sektör otoriteleri, standart kuruluşları. Cümleni hangi ülke ve konuyla kurarsan onu izler.",
        },
      ],
      related: ["ihale-takibi", "rakip-takibi", "hibe-destek-takibi"],
    },
    {
      slug: "rakip-takibi",
      icon: "eye",
      name: "Rakip ve marka takibi",
      metaTitle: "Rakip fiyat, lansman ve marka takibi uygulaması — Whenly",
      metaDescription:
        "Rakibin fiyat değiştirdiğinde, ürün duyurduğunda veya markan kamuya açık olarak konuşulduğunda haber al. Whenly açık web'i senin yerine takip eder.",
      h1: "Rakibin hamlesini ve markanın nabzını gör",
      answer:
        "Whenly, rakiplerinin kamuya açık fiyat sayfalarındaki değişiklikleri, ürün ve basın duyurularını ve markan hakkında kamuya açık konuşmaları takip eder; kayda değer bir gelişme yayımlandığında bildirim gönderir.",
      context: [
        "Rakip fiyat değişikliğini geç fark etmek tekliflerin ve tahminlerin eski veriye dayanması demektir.",
        "Ürün ve basın duyuruları kaçırıldığında pazardaki hamleyi geç öğrenirsin.",
        "Marka hakkında olumsuz konuşma erken görülürse, büyümeden yanıt verme şansın olur.",
      ],
      examples: [
        "Rakibimin kamuya açık fiyat sayfasında değişiklik olursa haber ver.",
        "Rakibim yeni ürün veya basın açıklaması duyurursa bildir.",
        "Markam kamuya açık platformlarda olumsuz tonda öne çıkarsa haber ver.",
      ],
      faq: [
        {
          q: "Bu etik mi?",
          a: "Evet — yalnız kamuya açık bilgiler izlenir: rakibin kendi yayımladığı fiyat sayfası, basın bülteni ve herkese açık konuşmalar. Gizli veriye, kapalı hesaplara veya kişisel takibe girilmez; kişileri izlemek kullanım koşullarında açıkça yasaktır.",
        },
        {
          q: "Marka takibi neleri kapsar?",
          a: "Markanın adının geçtiği kamuya açık içerikler: haberler, forumlar, herkese açık paylaşımlar.",
        },
      ],
      related: ["mevzuat-takibi", "ihale-takibi", "fiyat-takibi"],
    },
    {
      slug: "duyuru-takibi",
      icon: "megaphone",
      name: "Duyuru ve sayfa takibi",
      metaTitle: "Bir sayfa yeni duyuru/sonuç yayımlayınca haber veren uygulama — Whenly",
      metaDescription:
        "Takip ettiğin sayfa yeni bir duyuru, sonuç listesi veya güncelleme yayımlayınca haber al. Whenly kamuya açık sayfaları senin yerine takip eder.",
      h1: "Bir sayfa yeni bir şey yayımlayınca haber al",
      answer:
        "Whenly, takip ettiğin kamuya açık sayfayı veya konuyu senin yerine kontrol eder; yeni bir duyuru, sonuç listesi ya da kayda değer bir güncelleme yayımlandığında bildirim gönderir. Sürekli F5'lemeyi bırakırsın.",
      context: [
        "Bir duyuruyu beklerken aynı sayfayı günde onlarca kez yenilemek zaman kaybıdır.",
        "Önemli güncellemeler çoğu zaman sessizce yayımlanır; bakmadığın an kaçar.",
        "Aynı anda birden çok kaynağı izlemek elle sürdürülebilir değildir.",
      ],
      examples: [
        "Takip ettiğim sayfada yeni bir duyuru yayımlanınca haber ver.",
        "Beklediğim sonuç listesi kamuya açık olarak yayımlanınca bildir.",
        "Bu sitede fiyat veya koşul güncellenince haber ver.",
      ],
      faq: [
        {
          q: "Giriş gerektiren sayfaları da izler mi?",
          a: "Hayır — yalnız kamuya açık, giriş/şifre/captcha gerektirmeyen sayfalar takip edilir. Kişisel hesabındaki bir sonucu sen kontrol edersin; Whenly sana doğru anı kazandırır.",
        },
        {
          q: "Belirli bir sayfayı mı izliyor?",
          a: "Hem belirli bir sayfayı hem de bir konuyu izleyebilir: ister adresini ver, ister ne beklediğini anlat.",
        },
      ],
      related: ["mevzuat-takibi", "fiyat-takibi", "stok-takibi"],
    },
  ],

  compare: {
    slug: "karsilastirma",
    metaTitle: "Whenly vs Google Alerts, Visualping, Distill — karşılaştırma",
    metaDescription:
      "Olay izleme araçları karşılaştırması: Whenly, Google Alerts, Visualping ve Distill hangi işte iyi? Doğal dil kuralları, bileşik koşullar ve alarm farkları.",
    h1: "Whenly'yi alternatifleriyle karşılaştırdık",
    answer:
      'Kısa cevap: belirli BİR sayfanın değişimini izlemek istiyorsan Visualping ve Distill olgun araçlardır; Google\'da yeni içerik e-postası istiyorsan Google Alerts ücretsizdir. Whenly farklı bir soruyu çözer: "şu OLAY gerçekleşince haber ver" — sayfa adresi bilmeden, doğal dille, bileşik koşullarla ve telefonu çaldıran alarmla.',
    intro:
      "Karşılaştırmayı kendi lehimize eğmeden yazdık; her aracın iyi olduğu işi açıkça söylüyoruz. Yanlış gördüğün bir bilgi varsa bize yaz, düzeltelim.",
    tableCaption: "Olay izleme araçlarının özellik karşılaştırması",
    colSelf: "Whenly",
    rows: [
      {
        f: "Temel yaklaşım",
        self: '"Şu olunca haber ver" cümlesi (konu/olay-bazlı)',
        ga: "Anahtar kelime: yeni içerik",
        vp: "Belirli URL'deki değişiklik",
        di: "Belirli URL'deki değişiklik",
      },
      {
        f: 'Doğal dilde bileşik koşul ("stok VE fiyat altı")',
        self: "Var — çekirdek özellik",
        ga: "Yok",
        vp: "Sınırlı",
        di: "Sınırlı (teknik kurulum)",
      },
      {
        f: "Sayfa adresi bilmek gerekir mi?",
        self: "Gerekmez — konu izlenir",
        ga: "Gerekmez",
        vp: "Gerekir",
        di: "Gerekir",
      },
      {
        f: "Telefonu çaldıran alarm modu",
        self: "Var (Pro)",
        ga: "Yok (e-posta)",
        vp: "Yok",
        di: "Kısmi",
      },
      {
        f: "Kendi dilinde kurulum (11 dil)",
        self: "Var",
        ga: "Kısmi",
        vp: "Kısmi",
        di: "Kısmi",
      },
      {
        f: "Ücretsiz plan",
        self: "3 izleme",
        ga: "Tamamen ücretsiz",
        vp: "Sınırlı kontenjan",
        di: "Sınırlı",
      },
      {
        f: "Şunda iyi",
        self: "Olay bekleme: fiyat, stok, ilan, ihale, mevzuat",
        ga: "Konu hakkında yeni içerik",
        vp: "Tek sayfanın görsel değişimi",
        di: "Teknik kullanıcı için sayfa farkı",
      },
    ],
    afterTable:
      'Özet: "Belirli bir sayfa değişince haber ver" işinde Visualping/Distill, "yeni içerik çıkınca e-posta" işinde Google Alerts yerinde seçimlerdir. "Bir OLAYI bekliyorum ve gerçekleştiği an telefonum çalsın" diyorsan Whenly bunun için tasarlandı.',
    // Rakip-bazlı derin karşılaştırmalar (GEO/ADR-097) — EN ile aynı slug'lar.
    toolsHeading: "Bire bir karşılaştırmalar",
    strengthsHeading: "{name} nerede güçlü",
    whenHeading: "Whenly ne zaman daha iyi seçim",
    tools: [
      {
        slug: "google-alerts",
        name: "Google Alerts",
        col: "ga",
        metaTitle: "Whenly vs Google Alerts (2026): olay uyarısı mı, e-posta özeti mi",
        metaDescription:
          "Google Alerts anahtar kelime için yeni içeriği e-postalar; Whenly tarif ettiğin olayı izler, gerçekleşince telefonunu çaldırır. Dürüst bir karşılaştırma.",
        h1: "Whenly vs Google Alerts",
        answer:
          'Google Alerts ücretsizdir ve bir anahtar kelimeyle ilgili yeni içerik çıktığında e-posta atar. Whenly başka bir soruya cevap verir: koşullu bir OLAY tarif edersin — "400 doların altına düşünce haber ver" — ve olay gerçekleştiğinde bildirim gönderir ya da alarm çaldırır. Birçok kişi ikisini birlikte kullanır.',
        strengths: [
          "Tamamen ücretsiz; kota derdi yok",
          "Google dizini arkasında — haber ve açık web kapsamı geniş",
          "Günde bir göz atılacak e-posta özetleri pratik",
        ],
        whenWhenly: [
          "Makale akışı değil, KOŞULLU bir olay bekliyorsun (X fiyatın altı, stokta)",
          "E-posta özeti değil, anlık bildirim ya da gerçek alarm istiyorsun",
          "Doğal dilde bileşik kural ve 11 arayüz dili istiyorsun",
        ],
        faq: [
          {
            q: "Whenly, Google Alerts'ün yerine geçer mi?",
            a: "Farklı işler yaparlar. Bir konunun haber akışını e-postayla izlemek için Google Alerts iyidir. Whenly belirli bir ânı yakalamak için kuruldu — eşik anlar, telefonu çaldırır. Birçok kişi ikisini birden kullanır.",
          },
          {
            q: "Whenly de Google Alerts gibi ücretsiz mi?",
            a: "Whenly'nin ücretsiz planında 3 aktif izleme süresiz kullanılır, kart istenmez. Pro daha çok izleme, daha sık kontrol ve alarm modu ekler.",
          },
        ],
      },
      {
        slug: "visualping",
        name: "Visualping",
        col: "vp",
        metaTitle: "Whenly vs Visualping (2026): sayfa farkı mı, doğal dilde olay mı",
        metaDescription:
          "Visualping belirttiğin sayfadaki görsel değişimi yakalamakta güçlüdür. Whenly konu-bazlıdır: olayı doğal dille tarif edersin, telefonunda alarm çalar.",
        h1: "Whenly vs Visualping",
        answer:
          "Visualping olgun bir değişiklik-izleme aracıdır: URL verirsin, o sayfanın görsel farklarını gösterir. Whenly işe öbür uçtan başlar — olayı doğal dille tarif edersin, URL gerekmez; olay açık kaynaklarda göründüğünde bildirim gönderir ya da alarm çaldırır.",
        strengths: [
          "Ekran görüntülü, vurgulamalı güçlü görsel sayfa-farkı motoru",
          "Yaygın kullanılan, cilalı tarayıcı eklentisi ve web uygulaması",
          "Hangi sayfayı izleyeceğini tam biliyorsan iyi seçim",
        ],
        whenWhenly: [
          "Doğru URL'yi aramak yerine sonucu tarif etmek istiyorsun",
          '"Stokta VE 500 doların altında" gibi doğal dilde bileşik koşul istiyorsun',
          "Alarm modlu, mobil-öncelikli uygulama istiyorsun; 2026 ortası itibarıyla Visualping'in Google Play'de Android uygulaması yok (değişirse yaz, düzeltelim)",
        ],
        faq: [
          {
            q: "Whenly bir Visualping alternatifi mi?",
            a: 'Sayfa-düzeyi görsel fark için Visualping güçlü bir seçim olmayı sürdürüyor. İhtiyacın "şu OLAY gerçekleşince haber ver" ise — koşullu, telefonda, alarmlı — Whenly tam bunun için kuruldu.',
          },
          {
            q: "Whenly'ye URL vermem gerekir mi?",
            a: "Hayır. İstersen verirsin ama düz bir cümle yeterli; Whenly eşleşen açık web sinyallerini birlikte tartar.",
          },
        ],
      },
      {
        slug: "distill",
        name: "Distill Web Monitor",
        col: "di",
        metaTitle: "Whenly vs Distill Web Monitor (2026): dürüst karşılaştırma",
        metaDescription:
          "Distill teknik kullanıcıya seçicilerle ince ayarlı sayfa izleme sunar. Whenly seçici kurulumu yerine doğal dil, alarm modu ve mobil-öncelikli deneyim koyar.",
        h1: "Whenly vs Distill Web Monitor",
        answer:
          "Distill teknik kullanıcılar için güçlü bir sayfa izleyicidir: öğeleri seçicilerle işaretler, yerel ya da bulutta kontrol koşturur, her şeyi ince ayarlarsın. Whenly tam tersi yolu seçer — tek düz cümle, seçici yok; açık webde olay tespiti, bildirim ve telefonu çaldıran gerçek alarm.",
        strengths: [
          "Öğe-düzeyi seçim, neyin 'değişiklik' sayılacağında hassas kontrol verir",
          "Yerel izleme seçenekleri gizlilik-odaklı teknik kullanıcıya hitap eder",
          "İleri kullanıcı için esnek zamanlama ve koşullar",
        ],
        whenWhenly: [
          "Site tasarımı değişince kırılan seçicilerle uğraşmak istemiyorsun",
          "Olayı yapılandırmak yerine tarif etmeyi tercih ediyorsun",
          "11 dilde, telefon-öncelikli deneyim ve alarm modu istiyorsun",
        ],
        faq: [
          {
            q: "Whenly'nin kurulumu Distill'den kolay mı?",
            a: "Tasarım gereği evet: kurulum tek cümledir. Karşılığı, seçici-tabanlı araçlardaki ince kontrolün olmamasıdır — sayfa-öğesi farkı isteyen ileri kullanıcı Distill'i tercih edebilir.",
          },
          {
            q: "Whenly, Distill gibi belirli bir sayfayı izleyebilir mi?",
            a: "Evet — URL verebilir ya da sadece konuyu tarif edebilirsin. Whenly yalnız açık sayfaları izler ve bu sınırı açıkça söyler.",
          },
        ],
      },
    ],
    faq: [
      {
        q: "Whenly, Google Alerts'ün yerine geçer mi?",
        a: "Farklı işler: Google Alerts yeni içeriği e-postayla listeler. Whenly olayı tanımlamanı ister ve gerçekleştiğinde telefonuna bildirim/alarm gönderir. Birçok kullanıcı ikisini birlikte kullanır.",
      },
      {
        q: "Visualping/Distill dururken neden Whenly?",
        a: 'O araçlar sayfa-bazlıdır: izlenecek URL\'yi senin bulman gerekir. Whenly konu-bazlıdır: "şu olunca" dersin, gelişmeyi hangi sayfada görünürse görünsün arar; bileşik koşul ve alarm ekler.',
      },
    ],
  },

  about: {
    slug: "hakkinda",
    metaTitle: "Whenly hakkında — ne yapar, kimler için",
    metaDescription:
      "Whenly, izlemesini istediğin gelişmeyi senin yerine takip eden bağımsız bir uygulamadır. Ne yaptığını ve sınırlarını açıkça yazıyoruz.",
    h1: "Whenly hakkında",
    paras: [
      "Whenly basit bir fikirden doğdu: hayatını etkileyen bir gelişmeyi beklerken aynı sayfayı sürekli yenilemek zorunda kalmamalısın. Bu takibi bir yazılım yapabilir.",
      "İzlemek istediğin şeyi kendi cümlenle anlatırsın; Whenly açık web kaynaklarını belirli aralıklarla senin yerine kontrol eder ve aradığın gelişme göründüğünde bildirim — istersen alarm — gönderir.",
      "İki ilkeye bağlıyız. Birincisi gizlilik: verini satmayız, reklam için kullanmayız; istediğin an indirir veya kalıcı silersin. İkincisi dürüstlük: vermediğimiz garantiyi yazmayız — saniyesinde bildirim veya hiçbir şeyi kaçırmama sözü vermeyiz, ve giriş/şifre arkasındaki sayfalara erişmediğimizi açıkça belirtiriz.",
      "Whenly bağımsız olarak geliştiriliyor. Sorular, düzeltmeler ve istekler için her zaman ulaşabilirsin.",
    ],
    factsHeading: "Künye",
    facts: [
      { k: "Ürün", v: "Whenly — izleme ve bildirim uygulaması" },
      { k: "Platformlar", v: "Web uygulaması + Android; bildirimler telefona gelir" },
      { k: "Diller", v: "Türkçe dahil 11 arayüz dili" },
      { k: "Fiyat", v: "Ücretsiz plan (3 izleme) + Pro abonelik" },
      { k: "Veri ilkesi", v: "Satılmaz, reklam yok; istediğin an indir veya sil" },
      { k: "İletişim", v: "__EMAIL__" },
    ],
  },

  notFound: {
    metaTitle: "Sayfa bulunamadı — Whenly",
    h1: "Bu sayfa yok",
    text: "Aradığın sayfa taşınmış veya hiç var olmamış olabilir. Ana sayfadan devam edebilirsin.",
    cta: "Ana sayfaya dön",
  },

  legalCommon: {
    updatedLabel: "Son güncelleme",
    versionLabel: "Sürüm",
    canonicalNote:
      "Bu metin uygulama içindeki metnin kopyasıdır; fark olursa uygulamadaki sürüm geçerlidir.",
  },

  /** Çözüm sayfası ortak dizgileri — render'da ternary/elle eşleme YOK (tek kaynak). */
  ucStrings: {
    context: "Nerede işine yarar?",
    examples: "Whenly'ye böyle söylersin",
    exHint: "Cümleyi kopyala, uygulamada yapıştır — izleme hazır.",
    related: "İlgili çözümler",
    faq: "Sık sorulanlar",
    copy: "Kopyala",
    copied: "Kopyalandı",
  },
};
