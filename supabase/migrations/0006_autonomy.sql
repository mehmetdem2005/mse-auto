-- 0006_autonomy.sql — self-improvement PRs, broad-signal opportunities, dynamic UI panels.  [v0.7]

create table if not exists improvements (
  id bigint generated always as identity primary key,
  pr_number int, url text, title text, rationale text,
  risk text, status text default 'open', files text[],
  created_at timestamptz default now()
);
create table if not exists opportunities (
  id bigint generated always as identity primary key,
  title text, area text, severity text, score int,
  suggestion text, status text default 'open',
  created_at timestamptz default now()
);
-- Dynamic, agent-written tables that the dashboard renders on demand.
create table if not exists panels (
  key text primary key, title text,
  columns jsonb not null default '[]', rows jsonb not null default '[]',
  updated_at timestamptz default now()
);

alter table improvements  enable row level security;  -- service-role only (worker + server-side reads)
alter table opportunities enable row level security;
alter table panels        enable row level security;

create index if not exists improvements_created_idx on improvements (created_at desc);
create index if not exists opportunities_open_idx on opportunities (status, score desc);
