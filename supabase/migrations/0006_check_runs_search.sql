-- 0006: Kontrol çalışmasına arama süreci kaydı (ADR-036).
-- Kullanıcı, watcher detayında AI'nın NEYİ aradığını ve HANGİ sonuçları
-- gördüğünü görebilsin diye sorgu + arama sonuçları saklanır (PII'siz:
-- canonical sorgu ve kamusal web sonuçları).
alter table check_runs
  add column if not exists search_query text,
  add column if not exists search_hits jsonb;
