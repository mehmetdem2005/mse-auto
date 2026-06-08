# Watcher · Ops Console (dashboard)

Vite + React + TypeScript web paneli. Üye görünümü (abonelik/plan) + **admin** görünümü
(analitik + fiyat düzenleme). Admin sekmesi yalnız `/v1/me` `isAdmin: true` dönerse görünür;
yetki sunucuda da zorlanır (`/v1/admin/*` admin değilse 403).

## Çalıştırma
```bash
cp .env.example .env   # değerleri doldur
pnpm install
pnpm -F @watcher/dashboard dev      # http://localhost:5173
```

- **Supabase ile:** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` ver → e-posta/parola girişi.
  Admini ayarlamak için Supabase'de `admins` tablosuna kullanıcının `user_id`'sini ekle.
- **Supabase olmadan (lokal test):** env'leri boş bırak → "dev kullanıcı kimliği" girişi.
  Backend'i `ADMIN_USER_IDS=admin_demo` ile çalıştır, panelde kimlik olarak `admin_demo` gir.

## Derleme / Dağıtım
```bash
pnpm -F @watcher/dashboard build    # dist/
```
Statik olarak Vercel'e dağıtılabilir (framework: Vite). Env değişkenlerini Vercel projesine ekle.
