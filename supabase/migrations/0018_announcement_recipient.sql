-- ADR-134: Duyurulara kişiye-özel hedefleme (hediye bildirimi). NULL = global (eski davranış,
-- tüm kullanıcılara görünür); dolu = yalnız o kullanıcının zilinde görünür. Eklemeli + geri-uyumlu:
-- mevcut satırlar NULL kalır (global), kod sütun yokken de çalışır (okuma JS'te filtreler, yazma best-effort).
alter table public.announcements add column if not exists recipient_user_id uuid;

-- Kişiye-özel duyuru sorgusu için yardımcı indeks (global okuma değişmedi).
create index if not exists announcements_recipient_idx
  on public.announcements (recipient_user_id);

comment on column public.announcements.recipient_user_id is
  'ADR-134: NULL=global; dolu=yalnız bu kullanıcının zilinde (hediye vb.). Filtre backend''de (service-role).';
