// Türkçe içerik — TEK KAYNAK. GEO yazım kuralları (docs/GEO-pazarlama-mimarisi.md):
// her sayfa "önce cevap" 40-60 kelimelik bağımsız paragrafla açılır; H2'ler soru
// biçimindedir (sohbet sorgularıyla eşleşir); istatistik/alıntılar saha araştırmamızdan
// (docs/gercek-talepler.md, 2026-06) gelir ve abartılmaz; her sayfa kısa tutulur.

/** @typedef {{ q: string, a: string }} Faq */
/** @typedef {{ slug: string, icon: string, name: string, metaTitle: string,
 *   metaDescription: string, h1: string, answer: string, pains: string[],
 *   examples: string[], faq: Faq[], related: string[] }} UseCase */

export const tr = {
  lang: "tr",
  prefix: "",
  useCaseBase: "/cozumler",
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
      "Whenly, doğal dille tarif ettiğin olayları yapay zekâ ile izler ve gerçekleştiği an haber verir.",
    useCases: "Çözümler",
    product: "Ürün",
    legal: "Hukuki",
    privacy: "Gizlilik Politikası",
    terms: "Kullanım Koşulları",
    contact: "İletişim",
    forAi: "AI asistanlar için: llms.txt",
    langSwitch: "English version",
  },

  home: {
    metaTitle: "Whenly — Şu olunca haber ver: yapay zekâ destekli olay izleme",
    metaDescription:
      '"Şu olunca haber ver" de, gerisini Whenly yapsın: interneti düzenli tarar, olayı yapay zekâ ile doğrular, anında bildirim veya alarm gönderir. Ücretsiz başla.',
    heroOverline: "Yapay zekâ destekli olay izleme",
    heroTitle: "Şu olunca <em>haber ver.</em>",
    heroSub:
      "İzlemek istediğin şeyi kendi cümlelerinle anlat. Whenly açık web kaynaklarını düzenli tarar, gelişmeyi yapay zekâ ile doğrular ve gerçekleştiği an telefonuna bildirim — istersen alarm — gönderir.",
    heroCta: "Ücretsiz başla",
    heroCtaNote: "Kredi kartı gerekmez · Web'de ve telefonda çalışır",
    heroSecondary: "Nasıl çalışır?",
    phone: {
      watcherLabel: "İZLENİYOR",
      watcherText: "İtalya Schengen vize randevusu İstanbul'da açılınca anında haber ver",
      watcherMeta: "Sık kontrol · Resmî kaynak önceliği",
      notifTitle: "Whenly · şimdi",
      notifText: "Randevu açıldı: İstanbul başvuru merkezi takviminde yeni slot görünüyor.",
      notifMeta: "%92 güvenle tespit edildi",
    },
    statHeading: "Neden böyle bir araç?",
    stats: [
      {
        n: "50",
        unit: "gerçek talep",
        t: 'Saha araştırmamızda forum ve şikâyet platformlarından, "böyle bir uygulama olsa" diyenler değil, sorunu bizzat yaşayanlar derlendi.',
      },
      {
        n: "dakikalar",
        unit: "içinde tükeniyor",
        t: "Vize randevusu, konser bileti ve stok düşüşleri çoğu zaman dakikalar içinde kapanıyor; elle yenileyen kaçırıyor.",
      },
      {
        n: "7/24",
        unit: "nöbet",
        t: "İnsanlar aynı sayfayı günde onlarca kez elle yeniliyor. Bu nöbeti senin yerine bir yazılım tutmalı.",
      },
    ],
    howHeading: "Whenly nasıl çalışır?",
    how: [
      {
        icon: "messageSquare",
        t: "Cümleyle anlat",
        d: '"Kadıköy\'de 2+1, 30.000 TL altı kiralık ilan çıkınca haber ver" gibi doğal bir cümle yaz. Form yok, kural motoru ezberi yok.',
      },
      {
        icon: "search",
        t: "Whenly izler",
        d: "Açık web kaynakları (resmî siteler, haberler, duyurular) seçtiğin sıklıkta taranır. Kişisel ayrıntıların dışarı gönderilmez; arama yalnız arındırılmış konuyla yapılır.",
      },
      {
        icon: "sparkles",
        t: "Yapay zekâ doğrular",
        d: 'Bulunan sonuçları model değerlendirir: olay gerçekten gerçekleşti mi? Her tespitin güven yüzdesi ve gerekçesi kaydedilir — "neden bu bildirim" her zaman görünür.',
      },
      {
        icon: "bellRing",
        t: "Anında haber al",
        d: "Gerçekleştiği an push bildirimi gelir; kritik konularda alarm moduyla telefon çalar. Gece sessiz saatler, watcher başına ses seçimi senin elinde.",
      },
    ],
    featuresHeading: "Öne çıkanlar",
    features: [
      {
        icon: "zap",
        t: "Bileşik koşullar",
        d: '"Stok VE 65.000 TL altı", "ilan VE bu semt" gibi basit alarmların beceremediği birleşik kuralları doğal dilden anlar.',
      },
      {
        icon: "shieldCheck",
        t: "Gizlilik sınırı tasarımda",
        d: "Serbest metnin kişisel-veri bölgesinde kalır; dış arama ve yapay zekâ servislerine yalnız kişisel ayrıntılardan arındırılmış konu gider.",
      },
      {
        icon: "languages",
        t: "11 dil",
        d: "Türkçe dahil 11 arayüz dili; izleme cümleni kendi dilinde yazarsın, kaynaklar dil fark etmeksizin taranır.",
      },
      {
        icon: "eye",
        t: "Şeffaf tespit",
        d: "Her bildirimde güven yüzdesi ve kaynak izi var. Ne arandı, ne bulundu, neden karar verildi — hepsi açık.",
      },
      {
        icon: "clock",
        t: "Sessiz saatler",
        d: "Gece bildirimleri sessiz bildirime iner; sabah kaldığın yerden devam edersin. Acil watcher'a istersen alarm yetkisi verirsin.",
      },
      {
        icon: "layers",
        t: "Sonar derin tarama",
        d: "Kritik konularda opsiyonel ikinci derin tur: daha fazla kaynak, yeniden muhakeme — kıl payı kaçırmalara karşı.",
      },
    ],
    pricingHeading: "Fiyatlandırma basit",
    pricing: {
      freeName: "Ücretsiz",
      freeBullets: [
        "3 aktif watcher",
        "Saatte bire kadar kontrol sıklığı",
        "Push bildirimleri + sessiz saatler",
        "Yapay zekâ doğrulamalı tespit",
      ],
      freeCta: "Ücretsiz başla",
      proName: "Pro",
      proBullets: [
        "100 aktif watcher",
        "Dakikada bire kadar kontrol sıklığı",
        "Alarm modu — telefon gerçekten çalar",
        "100 bildirim sesi + kişisel filtreler",
      ],
      proCta: "Uygulamada yükselt",
      note: "Ücretsiz plan süresiz; kart bilgisi istemez. Pro'ya uygulama içinden geçersin, istediğin an iptal edersin.",
    },
    useCasesHeading: "Ne için kullanılıyor?",
    useCasesSub:
      "Aşağıdakilerin hepsi gerçek kullanıcı taleplerinden geliyor — saha araştırmamızdaki en sık ve en acil senaryolar.",
    useCasesAll: "Tüm çözümleri gör",
    faqHeading: "Sık sorulan sorular",
    faq: [
      {
        q: "Whenly nedir?",
        a: 'Whenly, doğal dille tarif ettiğin bir olayı (örn. "PS5 resmî satıcıda stoğa girince haber ver") senin yerine izleyen bir uygulamadır. Açık web kaynaklarını düzenli tarar, gelişmeyi yapay zekâ ile doğrular ve gerçekleştiği an bildirim ya da alarm gönderir.',
      },
      {
        q: "Whenly ücretsiz mi?",
        a: "Evet — ücretsiz planda 3 aktif watcher ve saatte bire kadar kontrol sıklığı süresiz kullanılır, kart bilgisi istenmez. Pro plan daha çok watcher (100), dakikada bire kadar sıklık, alarm modu ve kişisel filtreler ekler.",
      },
      {
        q: "Hangi kaynakları izleyebilir?",
        a: "Kamuya açık web kaynaklarını: resmî kurum siteleri, haber siteleri, duyuru ve ilan sayfaları. Giriş/şifre gerektiren portallara, kişisel hesaplara ve captcha arkasındaki sayfalara erişmez — bu sınırı açıkça belirtiyoruz.",
      },
      {
        q: "Bildirimler ne kadar hızlı gelir?",
        a: "Watcher'ın kontrol sıklığına bağlıdır: ücretsiz planda saatte bire, Pro'da dakikada bire kadar. Tespit, kaynağın yayımlamasından sonraki ilk kontrolde yapılır. Saniyesinde garanti vermeyiz; kaynaklar geç yayımlayabilir, dizinler gecikebilir — bu dürüst sınırı kullanım koşullarımızda da yazıyoruz.",
      },
      {
        q: "Verilerim güvende mi?",
        a: "İzleme cümlen kişisel-veri bölgesinde kalır; dış arama ve yapay zekâ servislerine yalnız kişisel ayrıntılardan arındırılmış genel konu gönderilir. Verini satmayız, reklam için kullanmayız. Ayarlardan tüm verini indirebilir veya hesabınla birlikte kalıcı silebilirsin.",
      },
      {
        q: "Telefonda mı, web'de mi çalışır?",
        a: "İkisinde de. Web uygulaması her tarayıcıda çalışır; Android uygulaması aynı koddan üretilir. Bildirimler telefona push olarak gelir; Pro'da kritik watcher'lar için alarm modu vardır.",
      },
    ],
    ctaHeading: "Nöbeti Whenly devralsın",
    ctaText: "Bir cümle yaz, gerisini bırak. Olay gerçekleştiğinde ilk öğrenen sen ol.",
  },

  /** Çözüm sayfası ortak dizgileri — render'da ternary/elle eşleme YOK (tek kaynak). */
  ucStrings: {
    pains: "Sorun ne kadar gerçek?",
    examples: "Whenly'ye böyle söylersin",
    exHint: "Cümleyi kopyala, uygulamada yapıştır — watcher hazır.",
    related: "İlgili çözümler",
    faq: "Sık sorulanlar",
    copy: "Kopyala",
    copied: "Kopyalandı",
  },

  useCasesIndex: {
    slug: "cozumler",
    metaTitle: "Whenly çözümleri — neyi izleyebilirsin?",
    metaDescription:
      "Vize randevusundan stok takibine, ihaleden mevzuata: Whenly'nin yapay zekâ destekli izleme senaryoları. Hepsi gerçek kullanıcı taleplerinden derlendi.",
    h1: "Neyi izleyebilirsin?",
    intro:
      "Whenly konu-bazlı çalışır: bir sayfa adresi vermek zorunda değilsin, ne olmasını beklediğini anlatırsın. Aşağıdaki senaryoların tamamı saha araştırmamızdaki gerçek taleplerden geliyor.",
  },

  /** @type {UseCase[]} */
  useCases: [
    {
      slug: "vize-randevu-takibi",
      icon: "calendarClock",
      name: "Vize randevusu takibi",
      metaTitle: "Vize randevusu açılınca haber veren uygulama — Whenly",
      metaDescription:
        "Schengen/VFS vize randevusu bulamıyor musun? Whenly randevu takvimini senin yerine izler, slot açıldığı an bildirim veya alarm gönderir. Ücretsiz başla.",
      h1: "Vize randevusu açılınca anında haber al",
      answer:
        "Whenly, vize randevu duyurularını ve takvim sayfalarını senin yerine düzenli tarar; yeni slot veya iptalden boşalan randevu tespit edildiğinde telefonuna anında bildirim — Pro'da alarm — gönderir. Kurulum tek cümledir: hangi ülke, hangi şehir, ne olunca haber istediğini yazarsın.",
      pains: [
        'Saha araştırmamızda en keskin talep buydu: "Uyarı düştüğü an bakıyorum, 2 dakika geçsin tükenmiş oluyor" — slotlar dakikalar içinde kapanıyor.',
        "Randevu bulamayanlar bot ve aracılara 100€'dan fazla ödemek zorunda kalıyor; gün içinde iptalden düşen 5-10 slot saniyeler içinde kapılıyor.",
        "Elle takip sürdürülebilir değil: insanlar haftalarca her gün, günde onlarca kez aynı takvimi yeniliyor.",
      ],
      examples: [
        "İtalya Schengen vize randevusu İstanbul'da açılınca anında haber ver.",
        "Almanya vize randevusunda iptal düşüp slot açılırsa anında bildir.",
        "İngiltere vizesi için İstanbul'da standart (premium olmayan) randevu açılınca haber ver.",
      ],
      faq: [
        {
          q: "Whenly vize randevusunu benim yerime alıyor mu?",
          a: "Hayır — Whenly izler ve haber verir; randevuyu sen alırsın. Giriş gerektiren randevu portallarının içine erişmez; kamuya açık duyuru ve takvim sayfalarını, açılış haberlerini ve resmî duyuruları tarar. Bot karaborsasına alternatif, meşru bir erken-uyarı katmanıdır.",
        },
        {
          q: "Hangi vize randevuları izlenebilir?",
          a: "Kamuya açık duyuru yapan her randevu sistemi: Schengen başvuru merkezleri, konsolosluk duyuruları, ülke bazlı vize haber kaynakları. Cümleni ülke, şehir ve randevu tipiyle ne kadar netleştirirsen tespit o kadar isabetli olur.",
        },
        {
          q: "Slot saniyeler içinde kapanıyorsa bildirim yetişir mi?",
          a: "Dürüst cevap: her zaman değil. Whenly kaynağın yayımlamasından sonraki ilk kontrolde tespit eder; Pro'da bu dakikada bire kadar iner ve alarm modu telefonu gerçekten çaldırır. Garanti yerine, elle yenilemeye göre ölçülebilir bir hız avantajı sunar.",
        },
      ],
      related: ["doktor-randevu-takibi", "sonuc-takibi", "konser-bileti-takibi"],
    },
    {
      slug: "doktor-randevu-takibi",
      icon: "heartPulse",
      name: "Doktor randevusu takibi",
      metaTitle: "MHRS doktor randevusu açılınca haber veren uygulama — Whenly",
      metaDescription:
        "MHRS'de randevu bulamıyor musun? Whenly istediğin bölüm ve bölge için randevu açılışını izler, slot düştüğü an bildirim gönderir. Doğal dille kur, ücretsiz dene.",
      h1: "Doktor randevusu açılınca anında haber al",
      answer:
        'Whenly, doktor randevusu açılışlarını ve iptalden boşalan slot duyurularını senin yerine izler; aradığın bölüm ve bölgede uygunluk tespit edildiğinde anında bildirim gönderir. "Kadıköy\'de kardiyoloji randevusu açılınca haber ver" gibi tek bir cümleyle kurulur.',
      pains: [
        'Saha araştırmamızdan: "8 gündür her gün giriyorum" — açılan slotlar dakikalar içinde doluyor, gece yarısı nöbetleri normalleşmiş durumda.',
        "İptalden boşalan randevular en hızlı kapananlar; tam o anda bakmayan kaçırıyor.",
        "Kronik hastalar ve düzenli kontrol gerekenler için bu belirsizlik sağlık riski demek.",
      ],
      examples: [
        "Kadıköy'de kardiyoloji randevusu açılınca anında haber ver.",
        "İstanbul'da NVİ pasaport randevusu açılınca haber ver.",
        "Hepatit A aşısı Üsküdar'daki sağlık kuruluşlarında uygulanmaya başlayınca bildir.",
      ],
      faq: [
        {
          q: "Whenly MHRS hesabıma giriyor mu?",
          a: "Hayır. Whenly giriş gerektiren sistemlerin içine erişmez; kamuya açık duyuruları, açılış haberlerini ve uygunluk bilgisi yayımlayan sayfaları izler. Randevuyu her zaman kendi hesabınla kendin alırsın.",
        },
        {
          q: "Randevu izleme ücretsiz mi?",
          a: "Evet — ücretsiz planda 3 watcher'a kadar süresiz kullanırsın; kontrol sıklığı saatte bire kadardır. Slotların çok hızlı kapandığı durumlar için Pro, dakikada bire kadar sıklık ve alarm modu ekler.",
        },
      ],
      related: ["vize-randevu-takibi", "ilac-stok-takibi", "sonuc-takibi"],
    },
    {
      slug: "ilac-stok-takibi",
      icon: "pill",
      name: "İlaç stok takibi",
      metaTitle: "İlaç stoğa girince haber veren uygulama — Whenly",
      metaDescription:
        "Aradığın ilaç hiçbir eczanede yok mu? Whenly ilaç stok ve temin duyurularını izler, bulunabilirlik tespit edilince anında bildirim gönderir. Ücretsiz başla.",
      h1: "Aradığın ilaç stoğa girince haber al",
      answer:
        "Whenly, ilaç bulunabilirlik duyurularını, eczane ve dağıtıcı kaynaklarını, temin haberlerini senin yerine düzenli izler; aradığın ilacın bölgendeki bulunabilirliğine dair bir gelişme tespit edildiğinde anında bildirim gönderir. Tek cümleyle kurulur, 7/24 senin yerine bakar.",
      pains: [
        'Saha araştırmamızdaki en ağır hikâyelerden: "6 aydır arıyorum, 150 eczane gezdim" — kronik hastalar için ilaç bulmak tam zamanlı işe dönüşüyor.',
        "Stok geldiğinde haber veren merkezi bir kanal yok; insanlar tek tek eczane arıyor.",
        "Temin krizleri dalga dalga geliyor: doğru anı yakalayan alıyor, sonra yine tükeniyor.",
      ],
      examples: [
        "Pentasa 2g İstanbul Anadolu yakasındaki eczanelerde bulunur hâle gelince haber ver.",
        "Aradığım ilacın Türkiye'ye yeniden temin edildiğine dair duyuru çıkınca anında bildir.",
        "X ilacının muadili eczanelerde satışa sunulunca haber ver.",
      ],
      faq: [
        {
          q: "Whenly eczane stoklarını birebir görebilir mi?",
          a: 'Eczanelerin iç stok sistemlerine erişimi yoktur — bu dürüst sınırımız. İzlediği şey kamuya açık sinyallerdir: temin duyuruları, dağıtıcı/üretici açıklamaları, bulunabilirlik haberleri ve ilan sayfaları. Bu sinyaller çoğu zaman "eczane eczane gezmeden" önce davranmanı sağlar.',
        },
        {
          q: "Sağlık verilerim paylaşılıyor mu?",
          a: "İzleme cümlen kişisel-veri bölgesinde kalır; dış servislere yalnız kişisel ayrıntılardan arındırılmış genel konu gider. Verin satılmaz, reklam için kullanılmaz; istediğin an kalıcı silebilirsin.",
        },
      ],
      related: ["doktor-randevu-takibi", "stok-takibi", "fiyat-takibi"],
    },
    {
      slug: "stok-takibi",
      icon: "pkg",
      name: "Stok / restock takibi",
      metaTitle: "Stoğa girince haber veren uygulama (PS5, ekran kartı) — Whenly",
      metaDescription:
        'PS5, ekran kartı veya sneaker stoğa girince anında haber al. Whenly restock\'u yapay zekâ ile doğrular; "stok VE fiyat altı" bileşik koşullarını anlar.',
      h1: "Ürün stoğa girince anında haber al",
      answer:
        'Whenly, ürün stok durumunu ve satışa çıkış duyurularını senin yerine izler; ürün resmî satıcıda yeniden satışa sunulduğunda anında bildirim gönderir. Farkı bileşik koşullardır: "stoğa girince VE 65.000 TL altındaysa" gibi kuralları doğal dilden anlar.',
      pains: [
        'Saha araştırmamızdan: "Sepete attım, ödeme yaparken tükendi" — restock\'lar dakikalar, bazen saniyeler içinde bitiyor.',
        "Scalper'lar (karaborsacılar) botlarla alıp fahiş fiyata satıyor; sıradan alıcının tek şansı erken haber.",
        'Mevcut restock uygulamalarının 1 numaralı şikâyeti: "bildirim çok geç geldi, tıkladığımda stok bitmişti."',
      ],
      examples: [
        "PS5 Türkiye'de resmî satıcıda stoğa girince anında haber ver.",
        "RTX 5090, 65.000 TL altına stoğa girince haber ver.",
        "Jordan 4 Bred retail fiyatına stoğa girince veya raffle açılınca bildir.",
      ],
      faq: [
        {
          q: "Hangi mağazalar izlenebilir?",
          a: 'Kamuya açık ürün ve duyuru sayfası olan her satıcı. Whenly konu-bazlı çalıştığı için tek bir sayfa adresine bağlı kalmazsın: "resmî satıcıda" dersen açık web\'deki stok sinyallerini birlikte değerlendirir.',
        },
        {
          q: "Fiyat koşulunu da aynı anda kontrol edebilir mi?",
          a: "Evet — bileşik koşullar Whenly'nin çekirdek özelliği: \"stokta VE şu fiyatın altında\" tek watcher'da tanımlanır. Basit stok alarmlarının yapamadığı tam olarak bu.",
        },
        {
          q: "Alarm modu nedir?",
          a: "Pro'da kritik watcher'lara alarm yetkisi verirsin: bildirim sessizce düşmek yerine telefonu gerçekten çaldırır — saniyelerin önemli olduğu restock'lar için tasarlandı. 100 ses arasından seçebilir veya sessiz saat kuralı koyabilirsin.",
        },
      ],
      related: ["fiyat-takibi", "konser-bileti-takibi", "ilac-stok-takibi"],
    },
    {
      slug: "konser-bileti-takibi",
      icon: "ticket",
      name: "Konser bileti takibi",
      metaTitle: "Konser bileti satışa çıkınca haber veren uygulama — Whenly",
      metaDescription:
        "Bilet satış açılışını kaçırma: Whenly konser, maç ve etkinlik biletlerinin satışa çıkışını ve iade biletleri izler, açıldığı an bildirim veya alarm gönderir.",
      h1: "Bilet satışa çıkınca anında haber al",
      answer:
        'Whenly, konser ve etkinlik biletlerinin satış açılışını, yeni tarih duyurularını ve iadeden düşen biletleri senin yerine izler; satış açıldığı an bildirim — Pro\'da telefonu çaldıran alarm — gönderir. "Satış açılmadan 5 dakika önce hatırlat" gibi zamanlı kurallar da kurabilirsin.',
      pains: [
        'Saha araştırmamızdan: "2 saat bekledim, sıram gelmeden tükendi" — popüler konserlerde açılış anını kaçıran bilet bulamıyor.',
        "İade/yeniden satış biletleri rastgele anlarda düşüyor; sürekli bakmayan göremiyor.",
        "Karaborsa fiyatları resmî fiyatın katlarına çıkıyor; erken haber doğrudan para tasarrufu.",
      ],
      examples: [
        "Tarkan Ankara konseri biletleri satışa açılınca anında haber ver.",
        "Şebnem Ferah konserine resmî fiyatına iade bilet düşünce bildir.",
        "Galatasaray - Fenerbahçe derbisinin biletleri genel satışa çıkınca haber ver.",
      ],
      faq: [
        {
          q: "Bileti benim yerime alıyor mu?",
          a: "Hayır — Whenly haber verir, satın almayı sen yaparsın. Hesabına erişmez, sıraya senin yerine girmez; meşru bir erken-uyarı aracıdır.",
        },
        {
          q: "Satış tarihi belli değilse işe yarar mı?",
          a: 'Tam da o durumda işe yarar: "satışa açılınca haber ver" dersin, duyuru ve satış sayfası sinyallerini Whenly takip eder. Tarih açıklanınca da, satış başlayınca da haber alırsın.',
        },
      ],
      related: ["stok-takibi", "fiyat-takibi", "vize-randevu-takibi"],
    },
    {
      slug: "fiyat-takibi",
      icon: "trendingDown",
      name: "Fiyat takibi",
      metaTitle: "Fiyat düşünce haber veren uygulama (ürün, uçak, kripto) — Whenly",
      metaDescription:
        "Belirlediğin eşiğin altına inince haber al: e-ticaret ürünleri, uçak bileti, otel, kripto ve döviz. Whenly eşik kurallarını doğal dilden anlar. Ücretsiz başla.",
      h1: "Fiyat eşiğin altına inince haber al",
      answer:
        'Whenly, bir ürünün, uçak biletinin veya varlığın fiyatını senin belirlediğin eşiğe göre izler; eşik aşıldığında anında bildirim gönderir. "Dyson V15 12.000 TL altına inince haber ver" gibi tek cümleyle kurulur; düşüş de yükseliş de izlenebilir.',
      pains: [
        "Fiyat alarmı kurmayan kaçırıyor: indirimler ve hata fiyatları (error fare) saatler içinde kapanıyor.",
        "Uçak biletinde rezervasyon sonrası fiyat düşerse fark iadesi mümkün olabiliyor — ama ancak fark edersen.",
        'Kripto ve dövizde "fark ettiğimde geçmişti" en sık yakınma; eşik bildirimi temel ihtiyaç.',
      ],
      examples: [
        "Dyson V15 herhangi bir büyük e-ticaret sitesinde 12.000 TL altına inince haber ver.",
        "İstanbul–Bangkok uçak bileti 8.000 TL altına düşünce anında bildir.",
        "Bitcoin 1.500.000 TL üstüne çıkınca haber ver.",
      ],
      faq: [
        {
          q: "Hangi fiyatlar izlenebilir?",
          a: "Kamuya açık fiyat gösteren her şey: e-ticaret ürünleri, uçak/otel fiyatları, kripto ve döviz kurları. Eşik kuralını doğal dille verirsin; Whenly açık web'deki güncel fiyat sinyallerini değerlendirir.",
        },
        {
          q: "Sürekli mi kontrol ediyor?",
          a: "Watcher'ın sıklığında: ücretsiz planda saatte bire, Pro'da dakikada bire kadar. Eşiğe yaklaşan oynak fiyatlar için sıklığı artırmak Pro'nun tipik kullanım nedeni.",
        },
      ],
      related: ["stok-takibi", "kiralik-ev-ilan-takibi", "konser-bileti-takibi"],
    },
    {
      slug: "kiralik-ev-ilan-takibi",
      icon: "home",
      name: "Kiralık ev ilanı takibi",
      metaTitle: "Yeni kiralık ilan çıkınca haber veren uygulama — Whenly",
      metaDescription:
        "İyi kiralık ilanlar saatler içinde gidiyor. Whenly bölge + fiyat + oda kriterlerine uyan yeni ilanları izler, yayınlandığı an bildirim gönderir. Doğal dille kur.",
      h1: "Kriterine uyan kiralık ilan çıkınca anında haber al",
      answer:
        'Whenly, emlak ilan kaynaklarını bölge, fiyat ve oda sayısı gibi kriterlerine göre senin yerine izler; uyan yeni ilan yayımlandığında anında bildirim gönderir. "Kadıköy\'de 2+1, 30.000 TL altı yeni kiralık ilan çıkınca haber ver" — kurulum bu kadar.',
      pains: [
        'Saha araştırmamızdan: "İyi ilan saatler içinde gidiyor" — makul fiyatlı ilanlar aynı gün kapanıyor.',
        "İlan sitelerinin kendi bildirimleri gecikebiliyor veya kriter esnekliği sınırlı kalıyor.",
        "Birden çok semti ve koşulu elle taramak günde saatler alıyor.",
      ],
      examples: [
        "Kadıköy'de 2+1, 30.000 TL altı yeni kiralık ilan çıkınca anında haber ver.",
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
          a: "Evet — bileşik koşul desteği tam olarak bunun için var: semt + fiyat üst sınırı + oda sayısı tek cümlede tanımlanır. Pro'da kişisel filtrelerle (bölge/sayısal eşik) tespitler cihazında bir kez daha süzülür.",
        },
      ],
      related: ["fiyat-takibi", "ihale-takibi", "stok-takibi"],
    },
    {
      slug: "sonuc-takibi",
      icon: "gradCap",
      name: "Sonuç ve başvuru takibi",
      metaTitle: "Sonuçlar açıklanınca haber veren uygulama (KYK, YKS, TOKİ) — Whenly",
      metaDescription:
        "KYK bursu, YKS ek yerleştirme, TOKİ kurası, burs başvurusu: sonuç ve başvuru pencerelerini Whenly izler, açıklandığı an bildirim gönderir. Ücretsiz başla.",
      h1: "Sonuçlar açıklanınca ilk sen öğren",
      answer:
        'Whenly, sınav sonuçlarını, kura listelerini, burs ve başvuru duyurularını senin yerine izler; açıklama yayımlandığı an bildirim gönderir. "KYK burs sonuçları açıklanınca haber ver" veya "KPSS başvurusu açılınca ve son güne 2 gün kala hatırlat" gibi kurallar tek cümleyle kurulur.',
      pains: [
        'Saha araştırmamızdan: "e-Devlet\'i sürekli kontrol ediyorum" — sonuç bekleyenler günlerce F5 nöbeti tutuyor.',
        "Başvuru pencereleri kısa; son gün sistemler yoğunluktan çöküyor, erken davranan kazanıyor.",
        "Ek yerleştirme ve boş kontenjan listeleri açıklandıktan sonra hızla doluyor.",
      ],
      examples: [
        "KYK burs sonuçları açıklanınca anında haber ver.",
        "ÖSYM ek yerleştirme boş kontenjan listesi yayımlanınca bildir.",
        "TOKİ Bursa kurası hak sahibi listesi açıklanınca haber ver.",
        "KPSS başvuruları açılınca ve son güne 2 gün kala hatırlat.",
      ],
      faq: [
        {
          q: "e-Devlet'teki kişisel sonucumu görebilir mi?",
          a: 'Hayır — Whenly giriş gerektiren sistemlere erişmez. İzlediği şey kamuya açık duyurulardır: "sonuçlar açıklandı" haberi, resmî duyuru sayfası, liste yayını. Sonucunu kendi hesabınla saniyeler içinde kontrol edersin; Whenly sana doğru anı kazandırır.',
        },
        {
          q: "Hatırlatma kuralları da var mı?",
          a: 'Evet — "son güne 2 gün kala hatırlat" gibi zamana bağlı kurallar desteklenir; başvuru pencerelerini kaçırmamak için açılış ve kapanışı aynı watcher\'da izleyebilirsin.',
        },
      ],
      related: ["vize-randevu-takibi", "hibe-destek-takibi", "doktor-randevu-takibi"],
    },
    {
      slug: "ihale-takibi",
      icon: "gavel",
      name: "İhale ve RFP takibi",
      metaTitle: "Yeni ihale yayımlanınca haber veren uygulama (EKAP, RFP) — Whenly",
      metaDescription:
        "EKAP ihaleleri, zeyilnameler, RFP'ler: kriterine uyan ihale yayımlandığı an Whenly haber verir; değişiklikleri ve son teklif tarihlerini de izler.",
      h1: "Sektörüne uyan ihale yayımlanınca haber al",
      answer:
        "Whenly, kamu ihale ilanlarını (EKAP), zeyilname ve düzeltmeleri, özel sektör RFP duyurularını senin yerine izler; kriterlerine uyan yeni ilan veya değişiklik tespit edildiğinde anında bildirim gönderir. Takım arkadaşların olmadan da 7/24 ihale masası gibi çalışır.",
      pains: [
        'Saha araştırmamızdan: "İhaleyi bulmak kolay, değişikliği kaçırmamak zor" — zeyilname ve tarih değişikliğini kaçıran diskalifiye oluyor.',
        "İtiraz süreleri hak düşürücü: sonuç ilanını geç gören, 10 günlük penceresini kaybediyor.",
        "Pasif bakılan panolarda yeni ilanlar günler sonra fark ediliyor; rekabet erken görenin.",
      ],
      examples: [
        "EKAP'ta İstanbul'da inşaat malzemesi ihalesi yayımlanınca haber ver.",
        "Takip ettiğim ihalede zeyilname veya teklif tarihi değişikliği olursa anında bildir.",
        "Katıldığım ihalenin sonuç ilanı yayımlanınca haber ver.",
        "Takip ettiğim RFP'nin son teklif tarihine 48 saat kala hatırlat.",
      ],
      faq: [
        {
          q: "EKAP hesabımla bağlanıyor mu?",
          a: "Hayır — kamuya açık ilan ve duyuru sayfaları izlenir; giriş gerektiren ekranlara erişilmez. İlan metnine her zaman kaynağından kendin ulaşırsın; Whenly sana zamanı kazandırır.",
        },
        {
          q: "Ekipçe kullanabilir miyiz?",
          a: "Bugün hesaplar bireyseldir; aynı konuyu izleyen herkes kendi watcher'ını kurar. Takım hesapları yol haritamızda — yapılmamış bir şeyi yapılmış gibi anlatmıyoruz.",
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
        "KOSGEB, TÜBİTAK, kalkınma ajansı ve Horizon Europe çağrılarını Whenly izler; çağrı açıldığı an ve son başvuru yaklaşınca haber verir. Yılda tek pencereyi kaçırma.",
      h1: "Hibe çağrısı açıldığı an haber al",
      answer:
        "Whenly, hibe ve destek programlarının çağrı duyurularını senin yerine izler; başvuru penceresi açıldığında ve son tarihe yaklaşıldığında bildirim gönderir. KOSGEB, TÜBİTAK, kalkınma ajansları, AB/Horizon Europe — hangi kaynağa uyuyorsan tek cümleyle tanımlarsın.",
      pains: [
        'Saha araştırmamızdan: bazı çağrılar bütçe dolunca son tarihten önce kapanıyor — "son günden 1 gün önce kapandı" gerçek bir vaka.',
        "Kalkınma ajansı destekleri çoğu zaman yılda tek çağrı; kaçıran 12 ay bekliyor.",
        "Araştırmalar fon sağlayıcıların büyük bölümünün geç başvuruyu kabul etmediğini gösteriyor; 2 günlük gecikmeyle on binlerce dolarlık hibe kaçıyor.",
      ],
      examples: [
        "KOSGEB Ar-Ge destek çağrısı açılınca anında haber ver.",
        "İSTKA'nın yeni mali destek programı duyurulunca bildir.",
        "TÜBİTAK 1501 yeni dönem çağrısı açılınca haber ver.",
        "Horizon Europe'ta izlediğim konu 'forthcoming'ten 'open'a geçince anında bildir.",
      ],
      faq: [
        {
          q: "Son başvuru hatırlatması yapar mı?",
          a: 'Evet — açılışı ve son tarihi aynı watcher mantığıyla izlersin: "çağrı açılınca haber ver" + "son başvuruya 1 hafta kala hatırlat". Erken kapanma riskine karşı açıldığı an başvurmak en güvenlisi.',
        },
        {
          q: "Hangi fon kaynakları izlenebilir?",
          a: "Kamuya açık duyuru yapan her program: ulusal ajanslar, bakanlık destekleri, kalkınma ajansları, AB programları, vakıf hibeleri. Sektör ve uygunluk kriterini cümlene eklersen yalnız sana uyan çağrılar bildirilir.",
        },
      ],
      related: ["ihale-takibi", "mevzuat-takibi", "sonuc-takibi"],
    },
    {
      slug: "mevzuat-takibi",
      icon: "scale",
      name: "Mevzuat takibi",
      metaTitle: "Resmî Gazete ve mevzuat değişikliğinde haber veren uygulama — Whenly",
      metaDescription:
        "Sektörünü ilgilendiren yönetmelik, tebliğ veya KVKK kararı yayımlandığı an haber al. Whenly Resmî Gazete ve kurum duyurularını yapay zekâ ile izler.",
      h1: "Sektörünü ilgilendiren mevzuat değişince haber al",
      answer:
        'Whenly, Resmî Gazete\'yi ve düzenleyici kurum duyurularını senin tanımladığın konu çerçevesinde izler; sektörünü ilgilendiren yönetmelik, tebliğ veya karar yayımlandığında anında bildirim gönderir. "Kanunu bilmemek mazeret sayılmaz" riskini sistematik takiple yönetirsin.',
      pains: [
        "Uyum cezaları ağır: KVKK idari para cezaları milyonlarca TL'ye ulaşabiliyor; değişikliği geç fark eden cezayı öğrenince fark ediyor.",
        "Resmî Gazete her gün yayımlanıyor; ilgili tek maddeyi elle ayıklamak sürdürülebilir değil.",
        "Gümrük tarifesi ve ithalat tebliği değişiklikleri yanlış beyana ve ek maliyete yol açıyor.",
      ],
      examples: [
        "Resmî Gazete'de gıda sektörünü ilgilendiren yönetmelik yayımlanınca haber ver.",
        "KVKK yeni tebliğ veya ilke kararı yayımlayınca anında bildir.",
        "Gümrük tarifesinde elektronik ürünleri etkileyen değişiklik olursa haber ver.",
      ],
      faq: [
        {
          q: "Hukuki danışmanlık yerine geçer mi?",
          a: "Hayır — Whenly erken-uyarı katmanıdır: değişikliği ilk anda görmeni sağlar, yorumunu hukukçun yapar. Her bildirimde kaynak izi vardır; ilgili metne doğrudan gidersin.",
        },
        {
          q: "Yalnız Türkiye mevzuatı mı?",
          a: "Hayır — kamuya açık duyuru yapan her düzenleyici izlenebilir: AB direktifleri (NIS2, DORA, GDPR rehberleri), sektör otoriteleri, standart kuruluşları. Cümleni hangi ülke ve konuyla kurarsan onu izler.",
        },
      ],
      related: ["ihale-takibi", "rakip-takibi", "hibe-destek-takibi"],
    },
    {
      slug: "rakip-takibi",
      icon: "eye",
      name: "Rakip ve marka takibi",
      metaTitle: "Rakip fiyat, lansman ve marka krizi takibi — Whenly",
      metaDescription:
        "Rakibin fiyat değiştirdiğinde, ürün duyurduğunda veya markan hakkında olumsuz dalga başladığında ilk sen öğren. Whenly açık web'i yapay zekâ ile izler.",
      h1: "Rakibin hamlesini ve markanın nabzını ilk sen gör",
      answer:
        "Whenly, rakiplerinin fiyat sayfalarındaki değişiklikleri, ürün ve basın duyurularını, işe alım sinyallerini ve markan hakkındaki kamuya açık konuşmaları izler; kayda değer bir gelişme tespit edildiğinde anında bildirim gönderir. Pazarlama ekibi olmayanlar için de çalışan bir istihbarat hattıdır.",
      pains: [
        "Rakip fiyat değişikliğini geç fark etmek doğrudan kayıp: teklif ve tahminler eski fiyata göre yapılmış oluyor.",
        "İş ilanları erken sinyaldir — şirketler ürünü duyurmadan aylar önce o ürün için işe alır.",
        "Kriz iletişimi araştırmaları krizlerin üçte ikisinden fazlasının mesai saatleri dışında başladığını gösteriyor; ilk saatler kritik.",
      ],
      examples: [
        "Rakibimin fiyat sayfasında değişiklik olursa haber ver.",
        "Rakibim yeni ürün veya basın açıklaması duyurursa anında bildir.",
        "Markam hakkında sosyal medyada olumsuz tonda yoğunlaşma olursa haber ver.",
      ],
      faq: [
        {
          q: "Bu etik mi?",
          a: "Evet — yalnız kamuya açık bilgiler izlenir: rakibin kendi yayımladığı fiyat sayfası, basın bülteni, ilanlar ve herkese açık konuşmalar. Gizli veriye, kapalı hesaplara veya kişisel takibe asla girilmez; kişileri izlemek kullanım koşullarımızda açıkça yasaktır.",
        },
        {
          q: "Marka takibi neleri kapsar?",
          a: "Markanın adının geçtiği kamuya açık içerikler: haberler, forumlar, şikâyet platformları. Olumsuz yoğunlaşma erken tespit edilirse kriz büyümeden yanıt verirsin.",
        },
      ],
      related: ["mevzuat-takibi", "ihale-takibi", "fiyat-takibi"],
    },
  ],

  compare: {
    slug: "karsilastirma",
    metaTitle: "Whenly vs Google Alerts vs Visualping vs Distill — karşılaştırma",
    metaDescription:
      "Olay izleme araçları karşılaştırması: Whenly, Google Alerts, Visualping ve Distill hangi işte iyi? Doğal dil kuralları, yapay zekâ doğrulaması ve alarm farkları.",
    h1: "Whenly'yi alternatifleriyle dürüstçe karşılaştırdık",
    answer:
      'Kısa cevap: belirli BİR sayfanın değişimini izlemek istiyorsan Visualping ve Distill olgun araçlardır; Google\'da yeni içerik e-postası istiyorsan Google Alerts ücretsizdir. Whenly farklı bir soruyu çözer: "şu OLAY gerçekleşince haber ver" — sayfa adresi bilmeden, doğal dille, yapay zekâ doğrulamasıyla ve telefonu çaldıran alarmla.',
    intro:
      "Karşılaştırmayı kendi lehimize eğmeden yazdık; her aracın iyi olduğu işi açıkça söylüyoruz. Yanlış gördüğün bir bilgi varsa bize yaz, düzeltelim.",
    tableCaption: "Olay izleme araçlarının özellik karşılaştırması (Haziran 2026)",
    colSelf: "Whenly",
    rows: [
      {
        f: "Temel yaklaşım",
        self: 'Konu/olay-bazlı: "şu olunca haber ver" cümlesi',
        ga: "Anahtar kelime: Google dizinine giren yeni içerik",
        vp: "Sayfa-bazlı: belirli URL'deki değişiklik",
        di: "Sayfa-bazlı: belirli URL'deki değişiklik",
      },
      {
        f: 'Doğal dilde bileşik koşul ("stok VE fiyat altı")',
        self: "Var — çekirdek özellik",
        ga: "Yok",
        vp: "Sınırlı (alan/anahtar kelime seçimi)",
        di: "Sınırlı (seçici/regex ile teknik kurulum)",
      },
      {
        f: 'Yapay zekâ ile "olay gerçekleşti mi" doğrulaması',
        self: "Var — güven yüzdesi ve gerekçeyle",
        ga: "Yok",
        vp: "Kısmi (değişiklik özeti)",
        di: "Yok",
      },
      {
        f: "Sayfa adresi bilmek gerekir mi?",
        self: "Gerekmez — açık web'de konu izlenir",
        ga: "Gerekmez (Google dizini)",
        vp: "Gerekir",
        di: "Gerekir",
      },
      {
        f: "Telefonu çaldıran alarm modu",
        self: "Var (Pro)",
        ga: "Yok (e-posta)",
        vp: "Yok (e-posta/entegrasyon)",
        di: "Kısmi (uygulama içi sesli bildirim)",
      },
      {
        f: "Tespit gerekçesi/şeffaflık",
        self: "Her bildirimde güven yüzdesi + kaynak izi",
        ga: "Bağlantı listesi",
        vp: "Görsel fark (diff)",
        di: "Metin farkı (diff)",
      },
      {
        f: "Ücretsiz plan",
        self: "3 watcher, saatte bire kadar kontrol",
        ga: "Tamamen ücretsiz",
        vp: "Sınırlı ücretsiz kontenjan",
        di: "Sınırlı yerel izleme",
      },
      {
        f: "Şunda iyi",
        self: "Olay bekleme: randevu, stok, sonuç, ihale, mevzuat",
        ga: "Marka/konu hakkında yeni içerik e-postası",
        vp: "Tek sayfanın görsel değişimi",
        di: "Teknik kullanıcı için sayfa diff'i",
      },
    ],
    afterTable:
      'Özet: "Belirli bir sayfa değişince haber ver" işinde Visualping/Distill, "yeni içerik çıkınca e-posta" işinde Google Alerts yerinde seçimlerdir. "Bir OLAYI bekliyorum ve gerçekleştiği an telefonum çalsın" diyorsan Whenly bunun için tasarlandı.',
    faq: [
      {
        q: "Whenly, Google Alerts'ün yerine geçer mi?",
        a: "Farklı işler: Google Alerts, Google dizinine giren yeni içeriği e-postayla listeler; olay olup olmadığına karar vermez. Whenly olayı tanımlamanı ister, gerçekleşip gerçekleşmediğini yapay zekâ ile değerlendirir ve telefonuna anında bildirim/alarm gönderir. Birçok kullanıcı ikisini birlikte kullanır.",
      },
      {
        q: "Visualping/Distill dururken neden Whenly?",
        a: 'O araçlar sayfa-bazlıdır: izlenecek URL\'yi senin bulman gerekir ve "değişiklik" her zaman "beklediğin olay" değildir. Whenly konu-bazlıdır: "İstanbul\'da standart İngiltere vize randevusu açılınca" dersin; hangi sayfada görünürse görünsün olayı arar ve yapay zekâ "gerçekten açıldı mı" kararını verir.',
      },
    ],
  },

  about: {
    slug: "hakkinda",
    metaTitle: "Whenly hakkında — kim yapıyor, nasıl çalışıyor, neye inanıyoruz",
    metaDescription:
      "Whenly bağımsız geliştirilen, gizlilik sınırı mimariye gömülü bir olay-izleme uygulamasıdır. Dürüst sınırlarımızı ve çalışma ilkelerimizi açıkça yazıyoruz.",
    h1: "Whenly hakkında",
    paras: [
      "Whenly, tek bir gözlemden doğdu: insanlar hayatlarını etkileyen bir gelişmeyi beklerken aynı sayfayı günde onlarca kez elle yeniliyor — vize randevusu, ilaç stoğu, sınav sonucu, ihale ilanı. Bu nöbeti yazılım tutabilir.",
      'Ürünü şekillendiren şey saha araştırmasıdır: forumlardan, şikâyet platformlarından ve mağaza yorumlarından, "böyle bir uygulama olsa" diyenler değil, sorunu bizzat yaşayan insanların 50 gerçek talebi derlendi. Özellik listesi bu talep listesidir.',
      "Mimari iki ilkeye oturur. Birincisi gizlilik sınırı: serbest metnin kişisel-veri bölgesinde kalır; dış arama ve yapay zekâ servislerine yalnız kişisel ayrıntılardan arındırılmış konu gider. İkincisi dürüstlük: vermediğimiz garantiyi yazmayız — saniyesinde bildirim, hiç kaçırmama, sıfır yanlış alarm vadetmiyoruz; güven yüzdesi ve kaynak iziyle her tespitin hesabını veriyoruz.",
      "Whenly bağımsız olarak geliştiriliyor; arkasında reklam bütçesi değil, gerçek taleplerden damıtılmış bir ürün var. Sorular, düzeltmeler ve istekler için her zaman ulaşabilirsin.",
    ],
    factsHeading: "Künye",
    facts: [
      { k: "Ürün", v: "Whenly — yapay zekâ destekli olay izleme ve bildirim uygulaması" },
      { k: "Platformlar", v: "Web uygulaması + Android (aynı koddan); bildirimler telefona push" },
      { k: "Diller", v: "Türkçe dahil 11 arayüz dili" },
      { k: "Fiyat", v: "Ücretsiz plan (3 watcher) + Pro abonelik" },
      { k: "Veri ilkesi", v: "PII dış servislere gitmez; sat-ma, reklam-yok, profilleme-yok" },
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
      "Bu metin uygulama içindeki kanonik metnin birebir kopyasıdır; fark olursa uygulamadaki sürüm geçerlidir.",
  },
};
