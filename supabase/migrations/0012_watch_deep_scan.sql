-- 0012: ADR-089 — "Sonar" derin tarama tercihi (watcher başına).
-- Açıkken kontrol motoru güven bandından bağımsız çok-turlu doğrulama + daha
-- fazla kaynak kullanır (daha kapsamlı, biraz daha yavaş/maliyetli). Ek (additive),
-- varsayılan false → eski watcher'lar etkilenmez, geriye dönük güvenli.
alter table public.watches
  add column if not exists deep_scan boolean not null default false;
comment on column public.watches.deep_scan is
  'Sonar derin tarama (ADR-089): kontrolde eskalasyon zorlanır. Açan abone topic''i herkes için derinleştirir.';
