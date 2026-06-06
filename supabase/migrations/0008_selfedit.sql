-- 0008_selfedit.sql — prompt versions + incident log.  [v0.9]
create table if not exists prompts (
  id bigint generated always as identity primary key,
  name text, prompt text, score double precision, rationale text,
  created_at timestamptz default now()
);
create table if not exists incidents (
  id bigint generated always as identity primary key,
  kind text, detail text, video_id text, action text, rationale text,
  executed boolean default false, created_at timestamptz default now()
);
alter table prompts   enable row level security;
alter table incidents enable row level security;
create index if not exists prompts_name_score_idx on prompts (name, score desc);
create index if not exists incidents_created_idx on incidents (created_at desc);
