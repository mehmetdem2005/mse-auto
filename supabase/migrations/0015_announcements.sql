-- ADR-100: Duyurular. Admin oluşturur; kullanıcı zil → Duyurular ekranında görür.
-- Okuma/yazma backend (service-role) üzerinden; istemci doğrudan erişmez → RLS
-- açık ama policy YOK (yalnız service-role atlar; app_settings ile aynı desen).
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  kind text not null default 'info' check (kind in ('info','update','promo','warning')),
  image_url text,
  cta_label text,
  cta_url text,
  pinned boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sıralama (sabit önce, sonra en yeni) için yardımcı indeks.
create index if not exists announcements_order_idx
  on public.announcements (published, pinned desc, created_at desc);

alter table public.announcements enable row level security;

comment on table public.announcements is
  'Admin duyuruları (ADR-100). Yalnız service-role; kullanıcıya backend /v1/announcements üzerinden yayınlananlar gider.';
