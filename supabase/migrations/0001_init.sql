-- Watcher — ilk şema (TOGAF Phase C). Zon ayrımı: PII vs PII'siz/paylaşılan.
-- RLS: PII tabloları kullanıcı-kapsamlı (auth.uid()); paylaşılan tablolar yalnız service-role.
-- Backend service-role ile bağlanır (RLS bypass); istemci anon/auth ile (RLS zorunlu).

-- ============ PII ZON: profiles ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  locale text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_own" on public.profiles
  for all using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ============ PAYLAŞILAN/PII'siz ZON: canonical_topics (dedup birimi, P2) ============
create table if not exists public.canonical_topics (
  id uuid primary key default gen_random_uuid(),
  canonical_query text not null unique,          -- PII sıyrılmış; dedup anahtarı (P1/P2)
  search_params jsonb not null default '{}'::jsonb,
  check_state text not null default 'idle',
  last_checked_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.canonical_topics enable row level security;
-- Politika YOK → istemci erişemez; yalnız service-role bypass eder (Phase C kararı).

-- ============ PII ZON: watches ============
create table if not exists public.watches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  raw_intent text not null,                       -- PII olabilir → dış hatta ASLA gitmez (P1)
  canonical_topic_id uuid not null references public.canonical_topics(id) on delete restrict,
  archetype text not null check (archetype in ('shared','personal')),  -- ADR-010
  frequency_minutes int not null check (frequency_minutes between 5 and 1440),
  status text not null default 'active' check (status in ('active','paused')),
  created_at timestamptz not null default now()
);
create index if not exists watches_user_id_idx on public.watches(user_id);
create index if not exists watches_topic_id_idx on public.watches(canonical_topic_id);
alter table public.watches enable row level security;
create policy "watches_own" on public.watches
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ============ PII (hassas) ZON: personal_criteria (arketip-B, cihaz öncelikli) ============
create table if not exists public.personal_criteria (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  watch_id uuid not null references public.watches(id) on delete cascade,
  criteria_data jsonb not null,                   -- şifreli/yerel öncelikli
  created_at timestamptz not null default now()
);
create index if not exists personal_criteria_user_idx on public.personal_criteria(user_id);
alter table public.personal_criteria enable row level security;
create policy "personal_criteria_own" on public.personal_criteria
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ============ PAYLAŞILAN ZON: check_runs ============
create table if not exists public.check_runs (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.canonical_topics(id) on delete cascade,
  ran_at timestamptz not null default now(),
  result_summary text,
  reasoning text,
  decision boolean not null default false,
  confidence numeric
);
create index if not exists check_runs_topic_idx on public.check_runs(topic_id);
alter table public.check_runs enable row level security;
-- Politika YOK → yalnız service-role.

-- ============ PAYLAŞILAN ZON: detection_events ============
create table if not exists public.detection_events (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.canonical_topics(id) on delete cascade,
  check_run_id uuid not null references public.check_runs(id) on delete cascade,
  description text not null,
  detected_at timestamptz not null default now()
);
create index if not exists detection_events_topic_idx on public.detection_events(topic_id);
alter table public.detection_events enable row level security;
-- Politika YOK → yalnız service-role.

-- ============ PII ZON: deliveries (fan-out) ============
create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.detection_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  watch_id uuid not null references public.watches(id) on delete cascade,
  channel text not null check (channel in ('push','alarm','wallpaper')),
  status text not null default 'pending' check (status in ('pending','sent','delivered','failed')),
  sent_at timestamptz
);
create index if not exists deliveries_user_idx on public.deliveries(user_id);
create index if not exists deliveries_event_idx on public.deliveries(event_id);
alter table public.deliveries enable row level security;
create policy "deliveries_select_own" on public.deliveries
  for select using (user_id = (select auth.uid()));
-- Insert/update yalnız service-role (fan-out backend'de yazar).

-- ============ PII-bitişik ZON: subscriptions ============
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  limits jsonb not null default '{}'::jsonb,
  payment_ref text,
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (user_id = (select auth.uid()));
-- Yazma yalnız service-role (faturalama backend'de).

-- ============ PII-bitişik ZON: device_tokens ============
create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fcm_token text not null,
  platform text not null default 'android',
  created_at timestamptz not null default now(),
  unique (user_id, fcm_token)
);
create index if not exists device_tokens_user_idx on public.device_tokens(user_id);
alter table public.device_tokens enable row level security;
create policy "device_tokens_own" on public.device_tokens
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ============ PII ZON: user_feedback ============
create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.detection_events(id) on delete cascade,
  verdict text not null check (verdict in ('correct','incorrect')),
  created_at timestamptz not null default now()
);
alter table public.user_feedback enable row level security;
create policy "user_feedback_own" on public.user_feedback
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ============ RPC: kontrol zamanı gelen topic'ler ============
-- "Due" = son kontrol, topic'e bağlı aktif watch'ların min frequency'sinden eski (ya da hiç).
create or replace function public.topics_due_for_check(p_now timestamptz)
returns table (id uuid, canonical_query text, last_checked_at timestamptz)
language sql
stable
as $$
  select t.id, t.canonical_query, t.last_checked_at
  from public.canonical_topics t
  where exists (
    select 1
    from public.watches w
    where w.canonical_topic_id = t.id and w.status = 'active'
    group by w.canonical_topic_id
    having t.last_checked_at is null
        or t.last_checked_at <= p_now - (min(w.frequency_minutes) * interval '1 minute')
  );
$$;
