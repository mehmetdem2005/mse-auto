-- 0005 — Feed "okundu" durumu.
-- deliveries satırına read_at: kullanıcı tespiti gördüğünde damgalanır.
-- Geriye dönük güvenli: NULL = okunmamış (mevcut tüm satırlar okunmamış sayılır).

alter table public.deliveries
  add column if not exists read_at timestamptz;

-- Kullanıcının okunmamışlarını hızlı saymak için kısmi index.
create index if not exists deliveries_user_unread_idx
  on public.deliveries (user_id)
  where read_at is null;

-- RLS not: deliveries zaten user_id = auth.uid() politikasıyla korunuyor (0001).
-- read_at güncellemesi backend service-role ile yapılır; istemci doğrudan yazmaz.
