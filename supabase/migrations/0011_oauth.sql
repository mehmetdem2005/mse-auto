-- 0011_oauth.sql — stored OAuth refresh tokens (UI-connected accounts).  [v1.4]
create table if not exists oauth_tokens (
  provider text primary key,
  refresh_token text not null,
  updated_at timestamptz default now()
);
alter table oauth_tokens enable row level security;
