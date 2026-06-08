-- Watcher — detection_events.facts (ADR-015). Tespit hattı yapılı, makine-değerlendirilebilir
-- kamusal veri üretir (koordinat/fiyat/sayı/metin). Arketip-B cihazı bu facts'i kendi
-- gizli kriterine (geo/numeric/keyword) karşı YERELDE değerlendirir; kriter sunucuya gitmez.
alter table public.detection_events add column if not exists facts jsonb;
comment on column public.detection_events.facts is
  'Kamusal yapılı olay verisi (PII''siz): geo/numeric/text. Cihaz-üstü kişisel filtre için.';
