-- 0012_agent_status.sql — live agent state for the AI CORE control center.
-- The worker upserts a row per agent as it runs (planning/running/completed/failed/…); the web
-- panel reads these for the holographic node states. The execution trace lives in job_events.
create table if not exists agent_status (
  agent_id      text primary key,
  display_name  text,
  status        text not null default 'idle',   -- idle|planning|waiting|running|completed|failed|blocked|needs_user_approval
  current_task  text default '',
  progress      int  default 0,
  job_id        uuid,
  updated_at    timestamptz not null default now()
);
create index if not exists agent_status_updated_idx on agent_status (updated_at desc);
