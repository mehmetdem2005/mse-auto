-- 0007_crew.sql — dynamic tool registry + autonomous announcements.  [v0.8]
create table if not exists tools_registry (
  name text primary key, description text, created_at timestamptz default now()
);
create table if not exists announcements (
  id bigint generated always as identity primary key,
  action text, summary text, details jsonb, created_at timestamptz default now()
);
alter table tools_registry enable row level security;
alter table announcements  enable row level security;
create index if not exists announcements_created_idx on announcements (created_at desc);
