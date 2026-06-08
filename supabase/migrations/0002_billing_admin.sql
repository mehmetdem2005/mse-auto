-- Faz: faturalama + admin (standartlara uygun abonelik).
-- plan_prices: fiyat kataloğu (sürümlenir; bir (plan,interval) için tek aktif fiyat).
-- subscriptions: satın alınan fiyat snapshot'lanır (grandfathering) + dönem + interval.
-- admins: rol kaynağı (DB; istemciye güvenilmez).

-- ============ subscriptions: faturalama alanları ============
alter table public.subscriptions
  add column if not exists billing_interval text check (billing_interval in ('month','year')),
  add column if not exists amount_cents integer check (amount_cents >= 0),
  add column if not exists currency text not null default 'usd',
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false;

-- ============ plan_prices (katalog) ============
create table if not exists public.plan_prices (
  id uuid primary key default gen_random_uuid(),
  plan text not null check (plan in ('pro')),
  billing_interval text not null check (billing_interval in ('month','year')),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
-- bir (plan, interval) için yalnız BİR aktif fiyat (sürümleme)
create unique index if not exists plan_prices_active_uq
  on public.plan_prices(plan, billing_interval) where active;
alter table public.plan_prices enable row level security;
-- Politika yok → yalnız service-role (fiyatlar backend üzerinden okunur).

-- ============ admins (rol) ============
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- Politika yok → yalnız service-role.
