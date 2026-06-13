# Watcher — Canlıya Alma Rehberi (v1)

**Mimari:** Supabase (DB/Auth) · Render (web + worker) · Vercel (mobil-web + tanıtım sitesi) · Google Cloud (FCM) · Expo EAS (mobil) · DeepSeek + Serper/Tavily.
Tüm deploy artefaktları repoda: `render.yaml`, `.github/workflows/deploy.yml` (mobil-web + site), `apps/website` (statik çıktı kendi `vercel.json`'ını üretir), `apps/mobile/eas.json`, `apps/*/.env.example`.

## 0. Ön koşul
pnpm 9 · Node 22. Hesaplar: Supabase, Render, Vercel, Google Cloud, Expo, DeepSeek, Serper (+Tavily).

## 1. Supabase
1. Yeni proje — bölge **EU (Frankfurt/İrlanda)** (KVKK veri ikametgâhı).
2. Settings → API: `Project URL`, `anon key`, `service_role key`. Database → Connection string (URI) → `DATABASE_URL`.
3. Migration'ları sırayla uygula (SQL Editor ya da CLI `supabase db push`):
   `supabase/migrations/0001_init.sql` → `0002_billing_admin.sql` → `0003_event_facts.sql`.
   Doğrulama: 12 public tablo, hepsinde RLS açık (PGlite ile yerel doğrulandı).
4. Auth → Email provider (magic link / OTP) aç — mobil login akışı buna dayanır.
5. Pro fiyatını ekle (yoksa abone-ol "fiyat tanımlı değil" verir):
   ```sql
   insert into plan_prices(plan,billing_interval,amount_cents,currency,active)
   values ('pro','month',9900,'usd',true), ('pro','year',99000,'usd',true);
   ```

## 2. Google Cloud — FCM
1. Firebase projesi → Cloud Messaging (v1).
2. Service Account (Firebase Admin) JSON anahtarı → `GOOGLE_SERVICE_ACCOUNT_JSON` (tek satır), `FCM_PROJECT_ID`.
3. Android app (package name = app.json `android.package`). EAS google-services'i yönetir.

## 3. DeepSeek + Serper (+ Tavily)
`DEEPSEEK_API_KEY`, `SERPER_API_KEY`, `TAVILY_API_KEY` (fallback). Boş bırakılırsa StubChecker (gerçek tespit yapmaz).

## 4. Render (web + worker) — `render.yaml` blueprint
1. New → **Blueprint** → repo'yu bağla → `watcher-backend` (web) + `watcher-worker` otomatik gelir.
2. **watcher-secrets** env grubunu doldur (Bölüm 1-3'teki tüm anahtarlar + `ADMIN_USER_IDS`).
3. Deploy. Sağlık: `GET https://watcher-backend.onrender.com/health` → `{"status":"ok"}`.
4. Scheduler tick worker içinde 60 sn'de bir döner (ayrı cron gerekmez).

## 5. Vercel — mobil-web + tanıtım sitesi
**Mobil-web (mevcut, otomatik):** `main`'e push → `.github/workflows/deploy.yml` Expo web export'unu mevcut Vercel projesine yayınlar (tek secret: `VERCEL_TOKEN`). (Dashboard kaldırıldı — ADR-032.)

**Tanıtım sitesi (`apps/website`, ADR-090) — tek seferlik kurulum:**
1. Vercel'de yeni proje aç (ör. `whenly-site`; framework: Other, build YOK — hazır statik çıktı deploy edilir) → proje ID'sini (prj_…) al.
2. GitHub repo → Settings → **Variables** → `VERCEL_PROJECT_ID_SITE` = prj_… ekle. (Variable tanımlı değilken workflow'daki `site` job'u zarifçe atlanır.)
3. Özel alan adı alınınca: Vercel projesine bağla + repo Variable `SITE_URL` = `https://alanadi` ekle (canonical/sitemap/JSON-LD otomatik düzelir); **uygulamanın adresi değişirse** Variable `APP_URL` da güncellenir (sitedeki tüm CTA/JSON-LD/llms.txt hedefi tek kaynaktan gelir). Cloudflare kullanılıyorsa **AI-crawler varsayılan engelini** kapat (1 Tem 2025 sonrası yeni alanlarda varsayılan açık).
4. İlk yayın sonrası: **Bing Webmaster Tools** + Google Search Console kaydı (IndexNow ping'i workflow'da otomatik). Site-dışı görünürlük adımları: `docs/GEO-pazarlama-mimarisi.md` §3.

## 6. Mobil (Expo EAS)
1. `npm i -g eas-cli && eas login`.
2. `apps/mobile/eas.json` profillerindeki `EXPO_PUBLIC_*` placeholder'larını gerçeğiyle değiştir.
3. **İlk gerçek koşu (hızlı):** `eas build --profile development --platform android` → cihaza kur → `npx expo start --dev-client`.
4. Üretim: `eas build --profile production --platform android` → `eas submit --platform android`.

## 7. İlk uçtan-uca duman testi (KRİTİK — uygulama ilk kez canlı)
1. Mobilde kayıt/giriş (magic link).
2. Watcher oluştur ("X olunca haber ver", 60 dk), uyarı=alarm + ses seç.
3. Render **worker** loglarında: scheduler tick → topic check → (eşleşirse) delivery.
4. Cihaza bildirim/alarm düştü mü?
5. `/v1/subscription` entitlements doğru mu? Pro'ya abone ol → alarm + kişisel filtre açıldı mı? (getSubscription downgrade/upgrade'i uzlaştırır.)

## Bilinen sınırlar / sıradaki fazlar
- **Ödeme (Stripe) yok** → abone-ol şu an doğrudan `subscribeUser` (test amaçlı). Canlı para için Stripe checkout + webhook fazı.
- **Arka plan push** (uygulama kapalı) + tam-ekran/loop alarm → native FCM arka-plan handler fazı (TaskManager).
- **KVKK/GDPR**: gizlilik politikası, onam, hesap silme akışı + Play "data safety" formu.
- Ses önizleme (`expo-audio`), gerçek Supabase/E2E entegrasyon testleri.

## 8. Google ile giriş — ✓ TAMAMLANDI (2026-06-13)
OAuth istemcisi (Web application) oluşturuldu; Supabase'de sağlayıcı Management API ile
etkinleştirildi ve `/authorize?provider=google` ucunun accounts.google.com'a doğru
client_id ile yönlendirdiği canlıda doğrulandı. Adımlar tarihçe/yeniden-kurulum içindir:
1. console.cloud.google.com → proje seç/oluştur → **APIs & Services → Credentials → Create OAuth client ID** (tip: Web application).
2. **Authorized redirect URI**: `https://kozckegiwuaywqkkkntp.supabase.co/auth/v1/callback`
3. Çıkan **Client ID + Secret**'ı Supabase Dashboard → Authentication → Providers → **Google**'a yapıştır ve etkinleştir.
   (İstersen Management API ile: `PATCH /v1/projects/<ref>/config/auth` → `external_google_enabled:true, external_google_client_id, external_google_secret`.)
4. Bitti — uygulamadaki "Google ile devam et" butonu çalışır (web yönlendirme + Android sistem tarayıcısı). Buton, sağlayıcı kapalıyken dürüst bir "henüz etkin değil" mesajı gösterir.

Not: `site_url` ve yönlendirme allow-list'i canlıda düzeltildi (2026-06-12 — magic link artık localhost'a değil uygulamaya döner). Ek bildirim kanalları (Telegram/Resend/WhatsApp) için ilgili token'lar Render `watcher-secrets` grubuna girilene dek kanallar pasiftir.

## 9. Global LLM modeli + Kaynaklar panosu (ADR-095)
**Model seçimi:** Admin konsolu → **Model**. Seçilen model (Groq Llama 3.3 70B ·
DeepSeek V4 Flash · V4 Pro · Reasoner) TÜM kullanıcıların muhakeme + doğrulama +
asistan çağrılarını sürer; yeniden başlatma gerekmez.
1. `DEEPSEEK_API_KEY`'i Render → Environment → **watcher-secrets** grubuna ekle
   (anahtar repoya ASLA yazılmaz). Groq zaten tanımlıysa ikisi de seçilebilir olur.
2. Seçimin deploy'lar arasında KALICI olması için migration `supabase/migrations/0014_app_settings.sql`
   gerekir — **✓ UYGULANDI (2026-06-13, kullanıcı izniyle; `app_settings` + RLS canlıda doğrulandı).**

**Kaynaklar panosu (gerçek kullanım verisi):** Admin → **Kaynaklar**. Her kart
sağlayıcının kendi API'sinden canlı çekilir; token tanımlı değilse kart dürüstçe
"token yok" der. İsteğe bağlı token'lar (hepsi watcher-secrets grubuna):
- `SUPABASE_ACCESS_TOKEN` — supabase.com/dashboard/account/tokens (proje durumu + DB boyutu)
- `RENDER_API_KEY` — dashboard.render.com → Account Settings → API Keys (servis durumu + bant genişliği)
- `VERCEL_TOKEN` (+ `VERCEL_TEAM_ID`) — vercel.com/account/tokens (dönem maliyeti / proje sayısı)
- DeepSeek bakiyesi mevcut `DEEPSEEK_API_KEY` ile gelir; Groq kullanım API'si sunmuyor (konsol bağlantısı verilir).

## 10. Duyurular + Console konumu (ADR-100)
**Duyuru sistemi** canlı: admin Konsol → **Duyurular**'dan görselli/CTA'lı duyuru oluşturur; kullanıcı üstteki **zile** basınca görür (zil artık Duyurular'a gider, Destek yalnız Ayarlar'da). Migration `0015_announcements.sql` **canlıya uygulandı (2026-06-13, kullanıcı izniyle)**. **Whenly Console** artık **Ayarlar** içinde (admin-only satır); ana ekrandaki gizli düğme kaldırıldı. Erişim: backend `adminMiddleware` + `admins` tablosu (tek admin = sahip) → fiilen yalnız sahip erişir.

## 11. Admin Faz D: Moderasyon + Push Yayın + Denetim (ADR-104)
Konsol → **Push Yayını** (segment all/free/pro), **Denetim** (admin işlem günlüğü), kullanıcı detayında **banla/ban-kaldır**. Ban'lı kullanıcı tüm `/v1`'de 403 (`ban.middleware`, fail-open; admin banlanamaz).

> **MIGRATION 0016 — BEKLİYOR (canlıya HENÜZ uygulanmadı).** `supabase/migrations/0016_admin_audit.sql`: `admin_audit` tablosu (immutable, RLS açık/policy yok = service-role) + `profiles.banned` kolonu. Backend bu şemayı bekler (audit yazımı + ban okuması) → **0016 canlıya uygulanmadan main'e merge/deploy ETME** (audit/kullanıcı-detay 500 verir). Sahip izniyle Supabase Management API (`/database/query`) ile uygulanıp burası "uygulandı" olarak güncellenecek. FCM env'i yoksa push yayını dürüstçe `inactive` döner (gönderim yapılmaz).
