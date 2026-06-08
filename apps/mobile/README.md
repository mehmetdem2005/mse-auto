# Watcher · Mobile (Expo)

Expo + expo-router + TanStack Query + Zustand + NativeWind. Backend API'sine bağlanır.
Kimlik doğrulama Supabase JWT (backend doğrular); Supabase yapılandırılmazsa **dev-token modu**
(backend `DevAuthVerifier` ile, token = kullanıcı kimliği).

## Yapı (ADR-004/006)
- `app/_layout.tsx` — providers + `Stack.Protected` ile auth/app grup koruması
- `app/(auth)/login.tsx` — giriş
- `app/(app)/_layout.tsx` — sekmeler (Watcher'lar · Yeni · Abonelik · Ayarlar)
- `app/(app)/index.tsx` — watcher listesi · `new.tsx` — oluştur · `subscription.tsx` — plan/faturalama · `settings.tsx` — bildirim izni + cihaz kaydı + çıkış
- `src/lib` — supabase, api (yerel tipler @watcher/contracts ile aynı), query · `src/stores/auth.ts` (Zustand)

## Çalıştırma (PC/VM)
```bash
cp .env.example .env   # EXPO_PUBLIC_API_BASE_URL + (opsiyonel) Supabase
pnpm install
pnpm -F @watcher/mobile start   # QR → Expo Go (geliştirme) veya development build
```
Emülatör/cihaz backend'e erişebilmeli → `EXPO_PUBLIC_API_BASE_URL` LAN IP olmalı (ör. `http://192.168.x.x:3000`).

> Push (FCM) ve native modüller **development build / cihaz** gerektirir (Expo Go'da sınırlı).
> Üretim derlemesi EAS Build ile yapılır (ADR-001).
