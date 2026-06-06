-- 0009_canary.sql — canary watch records for auto-revert.  [v1.0]
create table if not exists canaries (
  id bigint generated always as identity primary key,
  pr_number int, restore jsonb not null default '[]', baseline_error_rate double precision,
  watch_until timestamptz, status text default 'watching', created_at timestamptz default now()
);
alter table canaries enable row level security;
create index if not exists canaries_status_idx on canaries (status);
