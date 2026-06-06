-- 0002_aaa_layers.sql — production layers on top of 0001_init.sql
-- Adds: durable job leasing + retry/dead-letter, event/audit trail, usage ledger,
-- system control state, atomic claim/reclaim RPCs, updated_at triggers, and RLS.

-- ── video_jobs: reliability columns ───────────────────────────────────────────
alter table video_jobs add column if not exists attempts int not null default 0;
alter table video_jobs add column if not exists max_attempts int not null default 4;
alter table video_jobs add column if not exists priority int not null default 100; -- lower = sooner
alter table video_jobs add column if not exists locked_by text;
alter table video_jobs add column if not exists locked_until timestamptz;
alter table video_jobs add column if not exists next_run_at timestamptz not null default now();
alter table video_jobs add column if not exists last_error text;
alter table video_jobs add column if not exists trace_id text;
alter table video_jobs add column if not exists idempotency_key text;
create index if not exists jobs_next_run_idx on video_jobs (stage, next_run_at);
create index if not exists jobs_lock_idx on video_jobs (locked_until);

-- ── event/audit trail ─────────────────────────────────────────────────────────
create table if not exists job_events (
  id bigserial primary key,
  job_id uuid,
  trace_id text,
  stage text,
  type text not null,
  data jsonb not null default '{}',
  duration_ms int,
  created_at timestamptz not null default now()
);
create index if not exists job_events_job_idx on job_events (job_id, created_at desc);
create index if not exists job_events_type_idx on job_events (type, created_at desc);

-- ── usage ledger (cost/quota) ──────────────────────────────────────────────────
create table if not exists usage_ledger (
  id bigserial primary key,
  kind text not null,            -- text | reasoning | image | tts | embed | youtube_units
  units numeric not null default 0,
  cost_usd numeric not null default 0,
  job_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists usage_created_idx on usage_ledger (created_at desc);

-- ── system control state (kill switch / mode) ──────────────────────────────────
create table if not exists system_state (
  id int primary key default 1,
  paused boolean not null default false,
  mode text not null default 'run',  -- run | draft_only | dry_run
  reason text,
  updated_at timestamptz not null default now()
);
insert into system_state (id) values (1) on conflict (id) do nothing;

-- ── updated_at trigger for video_jobs ───────────────────────────────────────────
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_jobs_updated on video_jobs;
create trigger trg_jobs_updated before update on video_jobs
  for each row execute function set_updated_at();

-- ── atomic claim of the next actionable job (lease) ─────────────────────────────
-- Actionable: queued/approved any time; scheduled only when its slot has arrived.
-- Uses FOR UPDATE SKIP LOCKED so concurrent workers never grab the same row.
create or replace function claim_next_job(worker_id text, lease_seconds int default 900)
returns setof video_jobs language plpgsql as $$
declare j video_jobs;
begin
  select * into j from video_jobs
  where (locked_until is null or locked_until < now())
    and next_run_at <= now()
    and (
      stage in ('queued','approved')
      or (stage = 'scheduled' and scheduled_for is not null and scheduled_for <= now())
    )
  order by priority asc, next_run_at asc
  for update skip locked
  limit 1;

  if not found then return; end if;

  update video_jobs
     set locked_by = worker_id,
         locked_until = now() + make_interval(secs => lease_seconds)
   where id = j.id
   returning * into j;

  return next j;
end $$;

-- release expired leases (crashed/stuck workers) so jobs get retried
create or replace function reclaim_stale_locks()
returns int language plpgsql as $$
declare n int;
begin
  update video_jobs set locked_by = null, locked_until = null
   where locked_until is not null and locked_until < now()
     and stage not in ('published','failed','dead_letter','needs_review');
  get diagnostics n = row_count;
  return n;
end $$;

-- ── Row Level Security ───────────────────────────────────────────────────────────
-- Service role (worker + server route handlers) bypasses RLS automatically.
-- Lock the tables so the ANON key cannot read/write them from the browser.
alter table video_jobs   enable row level security;
alter table knowledge    enable row level security;
alter table memory       enable row level security;
alter table analytics    enable row level security;
alter table job_events   enable row level security;
alter table usage_ledger enable row level security;
alter table system_state enable row level security;
alter table config       enable row level security;
-- (No permissive policies for anon => anon is denied. Add Supabase Auth policies later
--  if you want the browser to read directly instead of via service-role server routes.)
