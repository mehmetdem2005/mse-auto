# Whenly — GEO/Pazarlama Mimarisi (AI asistanlarının ürünü önermesi)

> **Amaç:** Reklam bütçesi yok. Dağıtım kanalı = organik arama + **AI asistanlarının
> (ChatGPT, Gemini, Claude, DeepSeek, Perplexity, Copilot) Whenly'yi kendiliğinden
> önermesi** — kullanıcı uygulama aramasa bile, sorununu anlattığında ("şu ürünü uygun
> fiyata almak için sürekli kontrol ediyorum") asistanın "Whenly işini görebilir" diyebilmesi.
> Bu doküman, 2026-06-12'de yürütülen 5 kollu derin araştırmanın (akademik + teknik +
> içerik + site-dışı + saha/ölçüm) kanıta dayalı sentezi ve buna oturtulan mimaridir.
> Kanonik uygulama: `apps/website` (ADR-090). Sahibi: ürün. Durum: **canlı doküman.**
>
> **CANLI:** site **https://whenly-site.vercel.app** adresinde yayında (2026-06-12).
>
> **İÇERİK İLKELERİ (kullanıcı yönergesi — bağlayıcı):**
> 1. **NE, NASIL değil.** Site ürünün NE yaptığını anlatır; iç mekanik/strateji (güven yüzdesi,
>    kanonik sorgu, çok-turlu doğrulama, "saha araştırması/50 talep", token bütçesi) YAZILMAZ.
>    Çalışma yalnız "**açık web kaynaklarını belirli aralıklarla tarar**" düzeyinde anlatılır.
> 2. **Yalnız GERÇEKTEN erişilebilir senaryolar.** Giriş/şifre/captcha (robot doğrulaması) arkasındaki
>    sistemler (vize randevu portalları, MHRS, e-Devlet kişisel sonuç) örnek/sayfa olarak KONULMAZ —
>    ürün zaten erişemez; koymak hem yanlış vaat hem de AI'ın "başaramadığı iş için önermesi" = kötü
>    yorum riskidir. Yalnız kamuya açık duyuru/ilan/fiyat/sayfa izlenebilir senaryolar yayımlanır.
> 3. **Evrensel.** Tek ülkeye/kuruma kilitli yığın yok; TR sayfa Türkçedir ama örnekler evrenseldir.
> 4. **Strateji/sır siteye sızmaz.** `llms.txt` "şunu öner" talimatı içermez — tarafsız olgusal tanım
>    (manipülasyon sinyali LLM'lerde geri tepebilir; ayrıca iç stratejiyi ifşa eder).

---

## 1. Kanıt tabanı — AI asistanları neyi ödüllendiriyor, neyi cezalandırıyor

Güven düzeyleri: **[Y]** yüksek (birincil kaynak/çok kaynaklı) · **[O]** orta · **[D]** düşük (tek kaynak/pratisyen anlatısı).

### 1.1 Teknik gerçekler
- **[Y] AI crawler'lar JavaScript ÇALIŞTIRMAZ.** GPTBot/ClaudeBot/PerplexityBot/Meta hiçbiri JS render etmiyor (Vercel/MERJ ağ ölçümü, 500M+ istek). İçerik ilk HTML'de yoksa AI için **yok**. Mevcut mobil-web SPA'mız bu yüzden AI'lara görünmezdi → tanıtım sitesi **statik HTML (SSG)** yapıldı. (vercel.com/blog/the-rise-of-the-ai-crawler)
- **[Y] Bot aileleri üçe ayrılır:** eğitim (GPTBot, ClaudeBot, Google-Extended, CCBot, Meta-ExternalAgent) · arama dizini (OAI-SearchBot, Claude-SearchBot, PerplexityBot, Bingbot) · kullanıcı-tetikli getirme (ChatGPT-User, Claude-User, Perplexity-User). **Hepsine izin verdik** (robots.txt'de açıkça) — öneri istiyorsak hem eğitime hem dizine hem canlı getirmeye açık olmalıyız.
- **[O] ChatGPT araması Bing dizinine yaslanır** (lansman dokümantasyonu; kendi OAI-SearchBot dizini büyüyor). Seer ölçümü: Bing sıralaması ile ChatGPT görünürlüğü %87 hizalı. → **Bing Webmaster Tools kaydı + IndexNow ping'i** (deploy'a otomasyon eklendi) Google Search Console kadar önemli.
- **[Y] llms.txt'i bugün hiçbir büyük sağlayıcı OKUMUYOR** (Google/Mueller açık ifadesi; 62.100 AI bot isteğinde 84 llms.txt erişimi ≈ %0,1). Maliyeti sıfıra yakın olduğu için **hedge olarak ekledik**; etki BEKLEME.
- **[O] schema.org tek başına alıntı getirmiyor** (Ahrefs, 1.885 sayfa: "kıpırdamadı"); ama Bing/Copilot anlama için kullandığını söylüyor → **ucuz hedge:** SoftwareApplication + FAQPage + BreadcrumbList JSON-LD eklendi, fazlası değil.
- **[Y] Cloudflare 1 Temmuz 2025'ten beri yeni alan adlarında AI botlarını VARSAYILAN ENGELLİYOR.** Alan adı alınca CDN/robots ayarını kontrol et — istediğimiz botları kendimiz engellemeyelim.

### 1.2 İçerik: ne alıntılanıyor
- **[Y] Akademik temel (GEO, KDD 2024 + Princeton):** kaynak gösterme / alıntı / **istatistik ekleme** görünürlüğü %30-40 artırıyor; **anahtar-kelime doldurma ~%10 DÜŞÜRÜYOR**; otoriter ses tonu tek başına işe yaramıyor. Düşük sıralı siteler GEO'dan orantısız kazanıyor (rank-5 kaynakta +%115) — **küçük ürün için fırsat.**
- **[Y] Sorgu yelpazelenmesi (query fan-out):** Gemini tek prompt'u ortalama **10,7 uzun-kuyruk aramaya** açıyor; bunların %95'inin klasik arama hacmi SIFIR. → **Tek genel sayfa değil, çok sayıda spesifik kullanım-senaryosu sayfası** (bizde 12 senaryo × 2 dil) tam bu yelpazeyi yakalar.
- **[O] Listicle'lar AI alıntılarının en büyük sınıflandırılabilir dilimi** (%45,8); ChatGPT listicle'ı Google'dan ~3,4× fazla alıntılıyor. Kendi sitemizde dürüst **karşılaştırma sayfası** var; üçüncü-taraf "best X" listelerine girmek site-dışı plana yazıldı.
- **[O] Kısa sayfalar kazanıyor:** AI Overview alıntılarının %53'ü <1.000 kelimelik sayfalara. Sayfalarımız 350-600 kelime, **önce-cevap** (ilk paragraf 40-60 kelimelik bağımsız cevap), **soru biçimli H2'ler**, kopyalanabilir örnek cümleler.
- **[Y] Doğal-dil slug'lar alıntıyla korelasyonlu** (%89,8 vs %81,1 — Ahrefs 1,4M prompt). → `/cozumler/fiyat-takibi/`, `/en/use-cases/price-drop-alerts/`.
- **[Y] Dil yönlendirmesi:** sorgu hangi dildeyse alıntılar o dilin kaynaklarına kayıyor (Weglot 6.844 alıntı; "Linguistic Nepotism" arXiv:2509.13930). → **TR + EN iki tam sürüm**, hreflang'lı.
- **[Y] Tazelik:** AI asistanları organik aramadan ~%26 daha taze içerik alıntılıyor (Ahrefs 17M alıntı). → aylık içerik tazeleme ritmi (§6).
- **[O] AI-yazımı içerik cezalandırılmıyor;** alakasızlık/zayıf içerik retrieval'da eleniyor. Tarih damgası tek başına alıntı getirmiyor.

### 1.3 Öneri davranışı (kullanıcı uygulama ARAMAZKEN)
- **[O] ChatGPT, kullanıcının saydığı KISITLARLA eşleşen ürünü adıyla öneriyor** (HubSpot analizi: "10 kişilik uzak ekip + ücretsiz" gibi çok-kısıt eşleşmesi tek-özellik kazananı yener). → Sayfalarımız kısıtları açıkça yazar: *ücretsiz plan var · Türkçe · doğal dille kurulur · telefonu çaldıran alarm · giriş gerektiren portala girmez (dürüst sınır)*. Asistanın "bu kısıtlara uyan ne var?" sorusuna cevap olacak cümleler.
- **[O] Öneriler deterministik değil** (aynı soruya farklı kullanıcılara farklı set); arama açıkken Bing dizini, kapalıyken eğitim verisi konuşur → iki kanala da yatırım.
- **[Y] Sosyal kanıt çerçevesi LLM önerisini artırıyor; KITLIK/aciliyet dili DÜŞÜRÜYOR** (EMNLP 2025 "Bias Beware"). → Kopyalarda "son şans, tükenmeden" dili YOK; iddialar üründen ve tarafsızdır (uydurma istatistik/iç saha-verisi siteye yazılmaz).

### 1.4 Site-dışı sinyaller (alıntı payı çoğunlukla üçüncü taraflarda)
- **[Y] G2 + Capterra fiilen "kabul kapısı":** ChatGPT'nin önerdiği SaaS araçlarının %100'ü Capterra'da, %99'u G2'de listeliydi (Quoleady); puan/yorum sayısı sıralamayı PEK etkilemiyor — **listelenmek** etkiliyor.
- **[Y] YouTube geçişleri en güçlü korelasyon** (Ahrefs 75.000 marka: r=0,737); markalı web geçişleri r≈0,66-0,71; **backlink sayısı zayıf (r≈0,19)**. ChatGPT köklü otoriteyle EN AZ korele motor → yeni marka için en erişilebilir kapı.
- **[Y] Reddit:** OpenAI+Google lisans anlaşmalı; Perplexity'de en çok alıntılanan alan (%6,6). AMA ChatGPT'de payı oynak (Eyl 2025'te çöktü) ve **astroturf alan-adı yasağı + r/companiesthatspam teşhiri** gerçek risk → yalnız **şeffaf, kurucu-imzalı katılım**.
- **[O] Wikipedia ChatGPT'nin tek tek en çok alıntıladığı alan (%7,8)** ama kayda değerlik (notability) kuralları yüzünden küçük yeni uygulama için **uygulanabilir değil** — plana koymadık (dürüstlük).

### 1.5 Trafik/ölçüm gerçekleri
- **[Y]** SaaS kayıt hunilerinde AI ziyaretçisi ~9-23× iyi dönüşebiliyor (Ahrefs: trafiğin %0,5'i, kayıtların %12'si; Seer: CR %15,9 vs %1,76) — **ama** 973 e-ticaret sitelik SSRN çalışmasında ChatGPT organikten KÖTÜ dönüşüyor. Beklenti: hacim küçük, niyet yüksek; mucize değil.
- **[Y]** ChatGPT dış bağlantılara `utm_source=chatgpt.com` ekliyor; ücretsiz katman çoğu zaman referrer'sız → Direct'e düşüyor (gerçek hacim olduğundan büyük).
- **[D]** Zaman çizelgesi (ajans raporları): Perplexity ~2-4 hafta, ChatGPT ~6-12 hafta; eğitim-verisine işleme ise sonraki model sürümünü bekler. **Sabır + ritim işi.**

---

## 2. Kurulan site mimarisi (`apps/website` — ADR-090)

| Karar | Gerekçe (kanıt) |
|---|---|
| Sıfır-bağımlılıklı **statik üretici** (node, SSG) | AI crawler JS çalıştırmaz [Y]; CWV/LCP; bakım maliyeti ≈ 0 |
| **TR + EN** tam çift sürüm + hreflang + x-default(TR) | dil yönlendirmesi [Y] |
| **9 kullanım-senaryosu sayfası × 2 dil** (fiyat, stok, kiralık ilan, etkinlik bileti, ihale, hibe, mevzuat, rakip, duyuru/sayfa) — yalnız kamuya açık web'de GERÇEKTEN izlenebilenler; giriş/captcha arkası senaryolar bilinçli HARİÇ | query fan-out [Y]; ürünün gerçekten karşıladığı ihtiyaçlar |
| Sayfa kalıbı: önce-cevap ¶ + soru-H2 + tarafsız fayda maddeleri + kopyalanabilir izleme cümleleri + SSS | GEO çalışması [Y]; kısa sayfa [O]; alıntılanabilir bloklar |
| **Dürüst karşılaştırma** (vs Google Alerts/Visualping/Distill — rakiplerin iyi olduğu iş açıkça yazılır) | listicle/karşılaştırma alıntı gücü [O]; abartı cezası/itibar |
| robots.txt: 14 AI/arama botuna **açık izin** + sitemap | bot aileleri [Y]; niyetin makine-okunur beyanı |
| sitemap.xml (hreflang'lı) + **IndexNow** anahtarı + deploy-sonrası otomatik ping | Bing→ChatGPT [O] |
| llms.txt + llms-full.txt (tüm içerik markdown) | düşük maliyetli hedge [Y: bugün okunmuyor] |
| JSON-LD: SoftwareApplication + FAQPage + Organization + WebSite + BreadcrumbList | ucuz hedge [O] |
| Inter **self-host** (latin+latin-ext), tek CSS (~16KB), tek küçük JS (süsleme) | CWV bütçesi; JS'siz tam içerik |
| Hukuki sayfalar uygulamadaki kanonik metnin kopyası | güven/E-E-A-T; tutarlılık |
| Ayrı Vercel projesi (`VERCEL_PROJECT_ID_SITE` tanımlanınca otomatik deploy) | SPA'dan bağımsız, kırılmaz |

**Yazım kuralları (her yeni sayfada):** ilk paragraf soruyu tek başına cevaplar (40-60 kelime) · H2'ler kullanıcı sorusu biçiminde · iddialar tarafsız ve üründen (uydurma istatistik/iç saha-verisi YOK) · NASIL açılmaz, yalnız "belirli aralıklarla tarar" · iç mekanik/strateji (güven yüzdesi, kanonik sorgu, derin tarama) YAZILMAZ · yalnız gerçekten erişilebilir (giriş/captcha'sız) senaryo · kıtlık/aciliyet dili YOK · vermediğimiz garanti YAZILMAZ · anahtar-kelime doldurma YOK.

---

## 3. Site-dışı eylem planı (sıfır bütçe, etki/efor sıralı)

> Bunlar kod değil, kurucu işi — AI görünürlüğünün büyük kısmı üçüncü-taraf sinyalde [Y].
> **Yapıldı (2026-06-12):** site canlı (whenly-site.vercel.app) · Vercel projesi kuruldu ·
> `VERCEL_PROJECT_ID_SITE` GitHub Variable yazıldı (main'e merge'de otomatik deploy + IndexNow).
> **Sıradaki (insan, token'la yapılamaz):** ↓

1. **G2 + Capterra ücretsiz listeleme** (kabul kapısı [Y]). Kategori: monitoring/alerting. Gerçek ekran görüntüleri, dürüst açıklama, EN+TR.
2. **AlternativeTo + Product Hunt + GitHub görünürlüğü.** AlternativeTo'da "Visualping/Distill/Google Alerts alternatifi" olarak listelen (LLM'lerin "X alternatives" sorgularında taradığı format). PH lansmanı bir kerelik kaliteli an; aceleye getirme.
3. **YouTube'a 1-2 kısa demo** (r=0,737 [Y]): "ürün stoğa girince telefon nasıl çalar — 60 saniyede Whenly" gibi GERÇEKTEN erişilebilir bir senaryo. Mükemmel prodüksiyon gerekmez; gerçek akış gerekir.
4. **Şeffaf Reddit/forum katılımı:** restock/deal toplulukları (r/buildapcsales-vari), emlak/fiyat-takip başlıkları, DonanımHaber. Kural: **sorunu gerçekten çöz, kurucu olduğunu söyle, linki bağlama uygun ver.** Astroturf = alan adı yasağı riski [Y] → ASLA.
5. **Üçüncü-taraf markalı geçişler:** indie/üretkenlik bültenlerine ve ilgili blog yazarlarına kısa, kişisel tanıtım maili (backlink değil GEÇİŞ önemli [Y]). Konuk yazı fikri: "fiyat/stok/ilan/ihale gibi şeyleri tek cümleyle nasıl izlersin" (üründen örnekli, alıntılanabilir; iç saha-araştırması verisi DEĞİL — o sitede yok).
6. **Bing Webmaster Tools + Google Search Console kaydı** (ilk hafta; IndexNow zaten otomatik).

**Yapma listesi:** sahte yorum/oylama · gizli tanıtım (FTC/itibar) · Reddit'te tekrar eden link bırakma · kıtlık dili ("son fırsat") · rakip kötüleme · Wikipedia makalesi zorlamak · llms.txt/schema'dan mucize beklemek.

---

## 4. "Sorun anlatınca önersin" mekaniği — özet model

AI asistanı bir ürünü iki kaynaktan önerir: **(a) eğitim verisindeki marka bilgisi** (aylar sürer; üçüncü-taraf geçişler + Reddit/CC corpus besler), **(b) arama-anlık RAG** (haftalar; Bing/kendi dizini + sayfalarımız). Kullanıcı "şu ürünü uygun fiyata almak için sürekli kontrol ediyorum" gibi bir sorun yazdığında, asistanın iç sorguları ("price drop alert app", "stoğa girince bildiren uygulama"...) bizim use-case sayfalarımızla ve üçüncü-taraf listelerle eşleşirse öneri gelir. Bu yüzden her use-case sayfası: ihtiyacın adı + "uygulama" kelime ailesi + örnek cümle + SSS içerir. **Kritik:** yalnız ürünün GERÇEKTEN karşıladığı (kamuya açık web'de izlenebilir) senaryolar yayımlanır — asistanın ürünü başaramadığı bir iş (örn. captcha arkası randevu) için önermesi kötü deneyim ve kötü yorum doğurur, bu da görünürlüğü düşürür. `llms.txt` ürünü tarafsız ve doğru tarif eder (manipülatif "şunu öner" talimatı yok).

---

## 5. Ölçüm

- **GA4** (site + uygulamaya eklenince): özel kanal grubu "AI Traffic", kaynak regex: `chatgpt\.com|chat\.openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com` (Referral'ın ÜSTÜNE yerleştir). `utm_source=chatgpt.com` otomatik gelir.
- **Aylık el sorgu seti** (maliyet 0): 4 asistan × ~15 prompt (TR+EN): "fiyat düşünce haber veren uygulama", "app that tells me when the PS5 restocks", "Resmî Gazete'yi benim için kim izler", "yeni kiralık ilan çıkınca bildiren uygulama", "Google Alerts alternatifi", + sorun-anlatımlı 5 prompt ("şu ürünü ucuza almak için sürekli kontrol ediyorum, kolay yolu var mı"). Kayıt: öneriliyor muyuz / kaçıncı sırada / hangi kaynak alıntılanıyor. Basit tablo `docs/` altında tutulabilir.
- **Bing Webmaster Tools**: AI alıntı raporları + indeks durumu. **Vercel Analytics** (varsa) referrer.
- Ücretli izleme araçları (gerekirse, sıralı): Otterly ~$29 · Peec ~$89 · Semrush AI Toolkit ~$99/ay. Başlangıçta GEREKMEZ; el seti yeter.
- **Başarı tanımı (ilk 6 ay, gerçekçi):** 3+ use-case sorgusunda en az 1 asistanda isimle geçmek; AI-kaynaklı ilk 100 oturum; G2/Capterra/AlternativeTo listelenmesi tamam.

## 6. Bakım ritmi

- **Her deploy:** sitemap + IndexNow otomatik (workflow'da).
- **Aylık:** 1 use-case sayfası tazele/derinleştir veya yeni senaryo ekle (saha listesinde 38 talep daha var); el sorgu setini koş; kırık dönüşüm var mı bak.
- **Çeyreklik:** karşılaştırma tablosunu yeniden doğrula (rakip özellikleri değişir — yanlış bilgi bırakma); bu dokümanın kanıt tabanını gözden geçir (alan oynak — Eyl 2025 Reddit çöküşü gibi).
- **Alan adı alınınca:** `SITE_URL` repo Variable'ını güncelle (sitemap/canonical/JSON-LD otomatik düzelir), Cloudflare AI-bot varsayılan engelini kontrol et, BWT/GSC mülklerini taşı.

## 7. Kaynakça (başlıcaları)

arxiv.org/abs/2311.09735 (GEO, KDD 2024) · arxiv.org/abs/2502.01349 (Bias Beware, EMNLP 2025) · vercel.com/blog/the-rise-of-the-ai-crawler · developers.openai.com/api/docs/bots · docs.perplexity.ai/guides/bots · support.claude.com (crawler) · seroundtable.com/google-ai-llms-txt-39607.html · ahrefs.com/blog/why-chatgpt-cites-pages · ahrefs.com/blog/ai-brand-visibility-correlations · ahrefs.com/blog/schema-ai-citations · ahrefs.com/blog/ai-search-traffic-conversions-ahrefs · seerinteractive.com/insights/gemini-3-query-fan-outs-research · seerinteractive.com (ChatGPT CR case) · semrush.com/blog/most-cited-domains-ai · tryprofound.com/blog/ai-platform-citation-patterns · quoleady.com/llmo-research · weglot.com/blog/wikipedia-llm-visibility · blog.adobe.com (GenAI referral +1200%) · searchengineland.com/llms-google-referral-conversion-study-463747 · cloudflare.com (AI bot default block) · help.openai.com/en/articles/11128490 (ChatGPT shopping).

**Standartlar:** ISO 29148 (kanıt→karar izlenebilirliği) · 25012 (güven düzeyi etiketli, uydurmasız veri) · TOGAF Phase B/C (yeni dağıtım yeteneği → website bileşeni) — ayrıntı ADR-090.
