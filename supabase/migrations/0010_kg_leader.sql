-- 0010_kg_leader.sql — leader lease + knowledge-graph triples.  [v1.2]
create table if not exists leader_lease ( id int primary key default 1, holder text, expires_at timestamptz, updated_at timestamptz default now() );
create table if not exists triples ( id bigint generated always as identity primary key, s text, p text, o text, created_at timestamptz default now() );
alter table leader_lease enable row level security;
alter table triples enable row level security;
create index if not exists triples_spo_idx on triples (s, p, o);
