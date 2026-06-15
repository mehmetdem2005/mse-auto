-- ADR-135: Duyuru çok-dillilik. İki eklemeli (geri-uyumlu) sütun:
--  - template_key: sistem bildirimleri (ör. hediye) sabit anahtarla gider; istemci KULLANICININ
--    dilinde gösterir (×11 yerelleştirme kodda). NULL = serbest-metin (admin yazdığı title/body).
--  - lang: admin duyurusunun yazıldığı dil (BCP-47 kısa kod, ör. 'tr','en'). NULL = tüm diller
--    (dil-bağımsız; herkese görünür). Kullanıcı yalnız (lang NULL veya lang=kendi dili) olanları görür.
-- Mevcut satırlar NULL kalır → eski davranış (global, serbest-metin). Kod sütun yokken de çalışır.
alter table public.announcements add column if not exists template_key text;
alter table public.announcements add column if not exists lang text;

comment on column public.announcements.template_key is
  'ADR-135: dolu=istemci-yerelleştirmeli sistem bildirimi (gift vb.); NULL=admin serbest-metin.';
comment on column public.announcements.lang is
  'ADR-135: admin duyurusunun dili (tr/en/…); NULL=tüm diller. Kullanıcı kendi dili + NULL''ları görür.';
