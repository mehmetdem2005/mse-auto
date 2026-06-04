# MSE Auto — Canlı Kurulum Rehberi

## 🌐 Site Şu An Canlı
**Frontend:** https://mehmetdem2005.github.io/mse-auto/

---

## 1. Render Backend Kurulumu (AI & Ses Asistanı)

1. [render.com](https://render.com) → Dashboard → **New Web Service**
2. **GitHub repo bağla:** `mehmetdem2005/mse-auto`
3. **Root Directory:** `api`
4. **Build Command:** `npm install`
5. **Start Command:** `npm start`
6. **Environment Variables** ekle:
   ```
   GROQ_API_KEY = <size özel mesajda gönderildi>
   ALLOWED_ORIGIN = https://mehmetdem2005.github.io
   PORT = 3001
   ```
7. **Deploy** → URL'yi al (örn: `https://mse-auto-api.onrender.com`)
8. Admin panelinden bu URL'yi Ayarlar → API URL alanına girin

---

## 2. Supabase Kurulumu (Veritabanı & Auth)

1. [supabase.com](https://supabase.com) → **New Project** oluştur
2. Project hazır olunca → **SQL Editor** → `supabase/schema.sql` içeriğini yapıştır → Çalıştır
3. **Project Settings** → **API** → URL ve anon key'i kopyala
4. **Authentication** → **Providers** → Email Auth aktif et
5. Admin panelinden bu değerleri Ayarlar → Supabase bölümüne girin

---

## 3. Admin Panel Girişi

**URL:** https://mehmetdem2005.github.io/mse-auto/admin.html  
**Kullanıcı adı:** `admin`  
**Şifre:** `mseauto2024`

Admin panelinden şifreyi değiştirebilirsiniz.

---

## 4. Groq AI — Hızlı Başlatma (Backend beklemeden)

1. Admin paneli → **Ayarlar** → **API Ayarları**
2. Groq API Key: yukarıda mesajda paylaştığınız Groq key'inizi girin
3. Kaydet — AI asistan hemen aktif olur

> ⚠️ Bu key tarayıcıda görünür olur. Üretim ortamında mutlaka Render backend kullanın.

---

## 5. Sayfalar

| Sayfa | URL |
|-------|-----|
| Anasayfa | `/index.html` |
| Araçlar | `/gallery.html` |
| Araç Detay | `/car-detail.html` |
| Aracını Sat | `/sell.html` |
| Hakkımızda | `/about.html` |
| İletişim | `/contact.html` |
| Blog | `/blog.html` |
| SSS | `/faq.html` |
| Admin | `/admin.html` |
