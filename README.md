# Auto-Shorts Studio

Gemini destekli, **yarı-otonom** YouTube Shorts pipeline'ı. Az bilinen ama doğrulanmış gerçek
hikâyelerden kaliteli senaryo yazar, Gemini ile seslendirir, dikey video üretir, **tohumlu gündüz
saatlerinde** resmî YouTube API ile kanalına yükler. Tek kullanıcılık (private).

> **Tasarım felsefesi:** otomasyon ağır işi yapar, **sen onaylarsın**. YouTube'un 2026 "yapay-zekâ
> içerik" kapatma dalgasından korunmak için insan onay adımı, özgün yorum, çeşitlilik, AI ifşası ve
> düşük tempo zorunlu. Detay: `PLAN.md` §0.

## Ne yapar
- **Senaryo (kaliteli):** Gemini reasoning modeli + RAG (doğrulanmış kaynaklar) + Google Search
  grounding + function calling → retention odaklı, **özgün yorum** içeren JSON senaryo.
- **Seslendirme:** Gemini TTS (Türkçe, SynthID filigranlı).
- **Video:** Gemini ile özgün görseller + ffmpeg ile 1080x1920, altyazı + Ken-Burns.
- **Zamanlama:** tohumlu, deterministik-ama-rastgele gündüz slotları (saat penceresi, tavan, aralık).
- **Yükleme:** YouTube Data API v3 (resumable, AI ifşa).
- **RAG + Bellek:** Supabase pgvector. **Analytics:** YouTube istatistikleri + grafik.
- **Panel:** Dashboard, Queue/Approval, Knowledge, Memory, Analytics, Settings (her biri ayrı sayfa).

## Yapı (monorepo)
```
packages/core   → @studio/core  (pipeline beyni: gemini, rag, memory, scriptwriter,
                                  scheduler, compliance, youtube, video)
apps/worker     → durum makinesi (Render, Docker+ffmpeg) — cron tick / loop
apps/web        → Next.js panel (Vercel) — 6 sayfa + API route'ları
supabase/       → schema.sql (pgvector + tablolar + RPC'ler)
data/           → knowledge.seed.json (doğrulanmış hikâyeler)
remotion/       → (opsiyonel) stüdyo-kalite render yolu
```

## Hızlı başlangıç (yerel)
```bash
cp .env.example .env           # anahtarları doldur
# Supabase: supabase/schema.sql'i çalıştır
npm install
npm run build -w @studio/core
npm run seed -w @studio/core   # knowledge tabanını tohumla
npm run web:dev                # panel
npm run worker:tick            # tek pipeline turu
```

## Dağıtım
Tamamı **`HANDOFF.md`**'de (Claude Code için): Supabase provisyon, Vercel (web), Render (worker,
ffmpeg), YouTube OAuth refresh token, private kilit, APK (PWA/TWA/Capacitor).

## Güvenlik / etik
- Sadece resmî YouTube API; algı atlatma/sahte etkileşim **yok**.
- Görseller AI-üretimi/özgün veya senin varlıkların — telifli medya kazımak yok.
- Her video AI olarak ifşa edilir. Kaynaksız iddia yayınlanmaz.
- Service-role anahtarı yalnız sunucu/worker'da.
```
```
