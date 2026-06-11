/**
 * Yasal belgeler (ADR-079) — Gizlilik Politikası + Kullanım Koşulları.
 * Kanonik diller: TR + EN. Diğer 9 arayüz dilinde EN gösterilir ve ekran
 * yerelleştirilmiş bir "bağlayıcı sürüm İngilizce" notu basar (makine çevirisi
 * yasal metinde riskli — bilinçli karar). İçerik gerçek mimariyle birebirdir:
 * abartı yok, vermediğimiz garanti yazılmaz (ADR-074 dürüstlük ilkesi).
 */

export type LegalDocId = "privacy" | "terms";

export interface LegalSection {
  h: string;
  p: string;
}

export interface LegalDoc {
  title: string;
  version: string;
  updated: string; // ISO tarih
  sections: LegalSection[];
}

const CONTACT_EMAIL = "mehmetdem782100@gmail.com";

const privacyTr: LegalDoc = {
  title: "Gizlilik Politikası",
  version: "1.0",
  updated: "2026-06-11",
  sections: [
    {
      h: "1. Kim olduğumuz",
      p: `Whenly, kamuya açık web kaynaklarını senin adına izleyen ve bir gelişme tespit edildiğinde sana bildirim gönderen bir uygulamadır. Veri sorumlusuna bu politikadaki haklar dahil her konuda ${CONTACT_EMAIL} adresinden ulaşabilirsin.`,
    },
    {
      h: "2. Hangi verileri topluyoruz",
      p: "Hesap verisi: e-posta adresin ve kimlik doğrulama kayıtların. İzleme verisi: oluşturduğun watcher'ların serbest metin niyeti (kişisel bilgi içerebilir), sıklık ve kaynak tercihlerin. Cihaz verisi: bildirim için cihaz push token'ı ve platform bilgisi. Destek verisi: destek taleplerinde yazdığın mesajlar. Abonelik verisi: plan ve dönem bilgisi — kart bilgilerin bizde DEĞİL, ödeme sağlayıcısı Stripe'ta tutulur.",
    },
    {
      h: "3. Verini nasıl işliyoruz",
      p: "İzleme niyetin, kişisel ayrıntılardan arındırılmış genel bir arama konusuna (kanonik sorgu) dönüştürülür. Dış arama ve yapay zekâ servislerine yalnız bu arındırılmış konu gider; serbest metin niyetin ve kişisel ölçütlerin kişisel-veri bölgesinde kalır. Yapay zekâ asistanıyla sohbet ederken yazdığın metin, isteğini yapılandırmak için LLM işlemcisine iletilir. Verini satmayız, reklam için kullanmayız, profilleme yapmayız.",
    },
    {
      h: "4. Veri işleyiciler (alt yükleniciler)",
      p: "Barındırma ve veritabanı: Supabase (yönetilen Postgres; satır düzeyi erişim kuralları). Arama: Serper/Tavily (yalnız arındırılmış konu). Yapay zekâ: Groq/DeepSeek (yalnız arındırılmış konu ve asistan sohbet metni). Bildirim: Firebase Cloud Messaging (push token). Ödeme: Stripe (kart verisi yalnız Stripe'ta). Bu sağlayıcılar verini kendi amaçları için kullanamaz.",
    },
    {
      h: "5. Saklama süresi",
      p: "Verin, hesabın açık olduğu sürece saklanır. Hesabını sildiğinde watcher'ların, cihaz kayıtların, aboneliğin ve destek geçmişin kalıcı olarak silinir; bu işlem geri alınamaz. Yedeklerdeki kopyalar olağan yedek döngüsü içinde ortadan kalkar.",
    },
    {
      h: "6. Hakların (KVKK m.11 / GDPR)",
      p: "Erişme ve taşınabilirlik: Ayarlar'daki \"Verilerimi indir\" ile tüm verini makinece okunabilir JSON olarak alabilirsin. Düzeltme: watcher'larını uygulamadan değiştirebilirsin. Silme: Ayarlar'daki hesap silme tüm verini kalıcı siler. Ayrıca itiraz etme ve bulunduğun ülkenin veri koruma kurumuna şikâyet hakkın saklıdır. Talepler için e-posta da kullanabilirsin.",
    },
    {
      h: "7. Hukuki dayanaklar",
      p: "İşleme dayanakları: hizmeti sunmak için sözleşmenin ifası (izleme ve bildirim), açık rızan (bildirim izni) ve hizmeti güvenli işletmeye yönelik meşru menfaat (teknik kayıtlar, kötüye kullanım önleme).",
    },
    {
      h: "8. Güvenlik",
      p: "Veriye erişim sunucu tarafında yetki anahtarıyla, istemci tarafında satır düzeyi güvenlik kurallarıyla sınırlanır. Aktarımlar şifrelidir (HTTPS). Hiçbir sistem mutlak güvenlik vadetmez; bir ihlal hâlinde mevzuatın gerektirdiği bildirimler yapılır.",
    },
    {
      h: "9. Çocuklar",
      p: "Whenly reşit olmayanlara yönelik değildir. Bilerek çocuklardan veri toplamayız; fark edersek sileriz.",
    },
    {
      h: "10. Değişiklikler",
      p: "Bu politika değiştiğinde sürüm numarası ve tarih güncellenir; önemli değişiklikler uygulama içinden duyurulur.",
    },
  ],
};

const privacyEn: LegalDoc = {
  title: "Privacy Policy",
  version: "1.0",
  updated: "2026-06-11",
  sections: [
    {
      h: "1. Who we are",
      p: `Whenly is an app that watches publicly available web sources on your behalf and notifies you when a development is detected. You can reach the data controller about anything in this policy, including your rights, at ${CONTACT_EMAIL}.`,
    },
    {
      h: "2. What data we collect",
      p: "Account data: your email address and authentication records. Watch data: the free-text intent of the watchers you create (which may contain personal details), your frequency and source preferences. Device data: a push token and platform for notifications. Support data: messages you write in support threads. Subscription data: plan and billing period — your card details are NOT stored by us; they stay with our payment provider, Stripe.",
    },
    {
      h: "3. How we process your data",
      p: "Your watch intent is converted into a generalized search topic stripped of personal details (a canonical query). Only this stripped topic is sent to external search and AI services; your free-text intent and personal criteria stay in the personal-data zone. When you chat with the AI assistant, the text you write is sent to an LLM processor to structure your request. We do not sell your data, use it for advertising, or build profiles.",
    },
    {
      h: "4. Data processors (subprocessors)",
      p: "Hosting and database: Supabase (managed Postgres; row-level access rules). Search: Serper/Tavily (stripped topic only). AI: Groq/DeepSeek (stripped topic and assistant chat text only). Notifications: Firebase Cloud Messaging (push token). Payments: Stripe (card data stays with Stripe). These providers may not use your data for their own purposes.",
    },
    {
      h: "5. Retention",
      p: "Your data is kept for as long as your account exists. When you delete your account, your watchers, device registrations, subscription and support history are permanently erased; this cannot be undone. Copies in backups disappear within the regular backup cycle.",
    },
    {
      h: "6. Your rights (GDPR / local equivalents)",
      p: 'Access and portability: use "Download my data" in Settings to get all your data as machine-readable JSON. Rectification: edit your watchers in the app. Erasure: account deletion in Settings permanently removes all your data. You also retain the right to object and to lodge a complaint with your local data protection authority. You may also make requests by email.',
    },
    {
      h: "7. Legal bases",
      p: "We process data based on: performance of the contract (watching and notifying), your consent (notification permission), and legitimate interest in operating the service securely (technical logs, abuse prevention).",
    },
    {
      h: "8. Security",
      p: "Access to data is restricted server-side by a privileged key and client-side by row-level security rules. Transfers are encrypted (HTTPS). No system can promise absolute security; in case of a breach we will make the notifications required by law.",
    },
    {
      h: "9. Children",
      p: "Whenly is not directed at minors. We do not knowingly collect data from children; if we become aware of it, we delete it.",
    },
    {
      h: "10. Changes",
      p: "When this policy changes, the version number and date are updated; significant changes are announced in the app.",
    },
  ],
};

const termsTr: LegalDoc = {
  title: "Kullanım Koşulları",
  version: "1.0",
  updated: "2026-06-11",
  sections: [
    {
      h: "1. Hizmetin tanımı",
      p: "Whenly, KAMUYA AÇIK web kaynaklarını (resmî siteler, haberler, duyurular) düzenli aralıklarla tarar ve izlediğin konuda bir gelişme tespit ederse sana bildirim gönderir. Hizmet, giriş/şifre gerektiren portallara, kişisel hesaplara veya captcha arkasındaki sayfalara ERİŞMEZ.",
    },
    {
      h: "2. Garanti verilmeyenler (dürüst sınırlar)",
      p: 'Tespitin zamanlaması ve eksiksizliği garanti edilmez: kaynaklar geç yayımlayabilir, arama dizinleri gecikebilir, yapay zekâ değerlendirmesi hata yapabilir. Whenly "elinden gelenin en iyisi" esasıyla çalışır; saniyesinde haber alma, hiçbir gelişmeyi kaçırmama veya yanlış alarm olmaması taahhüt edilmez. Bildirimleri, kendi başına işlem dayanağı değil, kendi doğrulayacağın bir işaret olarak kullan.',
    },
    {
      h: "3. Hesabın ve sorumlulukların",
      p: "Hesabını ve erişim bilgilerini korumak senin sorumluluğundadır. Hizmeti yürürlükteki hukuka uygun kullanmalısın: kişileri izlemek/taciz etmek, başkalarının gizliliğini veya fikri haklarını ihlal etmek, hizmeti aşırı yükleyecek otomasyon kurmak yasaktır. İhlalde hesabın askıya alınabilir veya kapatılabilir.",
    },
    {
      h: "4. Abonelik ve ödeme",
      p: "Ücretli plan aboneliği Stripe üzerinden işlenir; tutar ve dönem satın alma ekranında gösterilir. Aboneliği istediğin an iptal edebilirsin; iptal, mevcut dönemin sonunda etkinleşir. Zorunlu tüketici hakların (cayma dahil) saklıdır.",
    },
    {
      h: "5. Fikri mülkiyet",
      p: "Uygulama, markası ve içeriği Whenly'ye aittir. Watcher'larında yazdığın içerik senindir; hizmeti sunmak için gereken sınırlı işleme izni dışında üzerinde hak iddia etmeyiz.",
    },
    {
      h: "6. Sorumluluğun sınırı",
      p: 'Hizmet "olduğu gibi" sunulur. Hukukun izin verdiği azami ölçüde, kaçırılan veya geciken bildirimlerden, yanlış tespitlerden veya bunlara dayanarak verdiğin kararlardan doğan dolaylı zararlardan sorumlu değiliz. Tüketici mevzuatından doğan vazgeçilemez hakların etkilenmez.',
    },
    {
      h: "7. Fesih",
      p: "Hesabını istediğin an silebilirsin (Ayarlar → hesabı sil). Koşulların ağır ihlalinde hizmeti sonlandırabiliriz; bu hâlde kalan ödenmiş dönem mevzuat çerçevesinde iade edilir.",
    },
    {
      h: "8. Değişiklikler ve iletişim",
      p: `Koşullar değiştiğinde sürüm ve tarih güncellenir; önemli değişiklikler uygulama içinden duyurulur. Sorular için: ${CONTACT_EMAIL}. Bir hükmün geçersiz sayılması diğer hükümleri etkilemez.`,
    },
  ],
};

const termsEn: LegalDoc = {
  title: "Terms of Service",
  version: "1.0",
  updated: "2026-06-11",
  sections: [
    {
      h: "1. What the service is",
      p: "Whenly periodically scans PUBLICLY available web sources (official sites, news, announcements) and sends you a notification when it detects a development on a topic you watch. The service does NOT access portals behind logins/passwords, personal accounts, or pages behind captchas.",
    },
    {
      h: "2. What we do not guarantee (honest limits)",
      p: "Timing and completeness of detection are not guaranteed: sources may publish late, search indexes may lag, and AI evaluation can make mistakes. Whenly operates on a best-effort basis; we do not promise second-level alerts, that nothing will ever be missed, or that there will be no false alarms. Treat notifications as a signal to verify yourself, not as a basis for action on its own.",
    },
    {
      h: "3. Your account and responsibilities",
      p: "You are responsible for protecting your account and credentials. You must use the service lawfully: tracking or harassing people, violating others' privacy or intellectual property, or building automation that overloads the service is prohibited. Violations may lead to suspension or termination of your account.",
    },
    {
      h: "4. Subscription and payment",
      p: "Paid plan subscriptions are processed via Stripe; the amount and period are shown on the purchase screen. You can cancel anytime; cancellation takes effect at the end of the current period. Your mandatory consumer rights (including withdrawal) remain unaffected.",
    },
    {
      h: "5. Intellectual property",
      p: "The app, its brand and content belong to Whenly. The content you write in your watchers is yours; we claim no rights over it beyond the limited processing needed to provide the service.",
    },
    {
      h: "6. Limitation of liability",
      p: 'The service is provided "as is". To the maximum extent permitted by law, we are not liable for indirect damages arising from missed or delayed notifications, incorrect detections, or decisions you make based on them. Your non-waivable consumer rights are unaffected.',
    },
    {
      h: "7. Termination",
      p: "You can delete your account at any time (Settings → delete account). We may terminate the service in case of serious breach of these terms; in that case any remaining paid period is refunded as required by law.",
    },
    {
      h: "8. Changes and contact",
      p: `When these terms change, the version and date are updated; significant changes are announced in the app. Questions: ${CONTACT_EMAIL}. If a provision is held invalid, the remaining provisions stay in effect.`,
    },
  ],
};

const DOCS: Record<LegalDocId, { tr: LegalDoc; en: LegalDoc }> = {
  privacy: { tr: privacyTr, en: privacyEn },
  terms: { tr: termsTr, en: termsEn },
};

/** Belgeyi dile göre çöz: tr→TR, diğer her dil→EN (+ ekranda yerel not). */
export function getLegalDoc(id: LegalDocId, lang: string): { doc: LegalDoc; canonical: boolean } {
  const pack = DOCS[id];
  if (lang === "tr") return { doc: pack.tr, canonical: true };
  return { doc: pack.en, canonical: lang === "en" };
}
