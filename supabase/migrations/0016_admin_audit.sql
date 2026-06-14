-- ADR-104: Etkileşim & moderasyon.
-- (a) admin_audit: her sonuç-doğuran admin mutasyonu izlenir (kim/eylem/hedef/zaman/meta).
--     DEĞİŞTİRİLEMEZ — RLS açık ama policy YOK (yalnız service-role yazar/okur;
--     app_settings/announcements ile aynı desen). Salt-ekleme; update/delete edilmez.
-- (b) profiles.banned: moderasyon bayrağı; banlı kullanıcı auth SONRASI 403 alır
--     (ban.middleware). Admin asla banlanmaz (setBanned reddeder → öz-kilitlenme yok).
create table if not exists public.admin_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id text not null,
  action text not null,
  target_type text not null,
  target_id text,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- En yeni önce — denetim log ekranı son N kaydı çeker.
create index if not exists admin_audit_created_idx
  on public.admin_audit (created_at desc);

alter table public.admin_audit enable row level security;

comment on table public.admin_audit is
  'Admin denetim günlüğü (ADR-104). Değiştirilemez; yalnız service-role yazar/okur.';

-- Moderasyon bayrağı (varsayılan: banlı değil; geriye dönük güvenli).
alter table public.profiles add column if not exists banned boolean not null default false;

comment on column public.profiles.banned is
  'Moderasyon (ADR-104): true ise kullanıcı backend tarafından 403 alır (ban.middleware).';
