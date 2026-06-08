# Watcher — Canlıya Alma Rehberi (v1)

**Mimari:** Supabase (DB/Auth) · Render (web + worker) · Vercel (dashboard) · Google Cloud (FCM) · Expo EAS (mobil) · DeepSeek + Serper/Tavily.
Tüm deploy artefaktları repoda: `render.yaml`, `apps/dashboard/vercel.json`, `apps/mobile/eas.json`, `apps/*/.env.example`.

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

## 5. Vercel (dashboard)
1. New Project → repo → **Root Directory = `apps/dashboard`**.
2. Env: `VITE_API_BASE_URL` (Render web URL), `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
3. Deploy (`vercel.json` SPA rewrite'ı uygular).

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
