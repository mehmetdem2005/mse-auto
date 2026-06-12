-- 0013: ADR-091 + ADR-092.
-- (a) watches.stop_after_hit / completed_at — sonuç bulununca izleme otomatik durur
--     (varsayılan AÇIK; kullanıcı kararı). completed_at otomatik durdurma anı.
-- (b) traffic_events — KİMLİKSİZ trafik telemetrisi (site/uygulama edinim sinyali):
--     kullanıcı kimliği, IP, user-agent, tam URL SAKLANMAZ (P1/25012).
-- Ek (additive) + idempotent; eski satırlar etkilenmez, geri-uyumludur.

alter table public.watches
  add column if not exists stop_after_hit boolean not null default true;
alter table public.watches
  add column if not exists completed_at timestamptz;
comment on column public.watches.stop_after_hit is
  'ADR-092: tespit teslim edilince izleme otomatik duraklatılır (paylaşılan arketipte sunucu, kişiselde cihaz tetikler).';
comment on column public.watches.completed_at is
  'ADR-092: otomatik durdurma anı; sürdürülünce null''lanır.';

create table if not exists public.traffic_events (
  id bigint generated always as identity primary key,
  day date not null,
  source text not null check (source in ('site', 'app')),
  ref text,
  utm text,
  path text,
  lang text,
  platform text check (platform in ('web', 'android', 'ios')),
  created_at timestamptz not null default now()
);
create index if not exists traffic_events_day_idx on public.traffic_events (day);
comment on table public.traffic_events is
  'ADR-091: kimliksiz trafik sinyali (gün+kaynak+ref alan adı+utm+yol+dil+platform). PII yok; RLS açık + policy yok = yalnız service-role.';

alter table public.traffic_events enable row level security;
-- Bilinçli: policy YOK → anon/authenticated erişemez; yalnız backend (service role).
