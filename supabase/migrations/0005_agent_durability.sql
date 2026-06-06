-- 0005_agent_durability.sql — durable agent checkpoints + tracing index.

-- ── durable agent run state (LangGraph-style checkpoint/resume) ─────────────────
create table if not exists agent_runs (
  job_id uuid primary key,
  plan jsonb not null default '[]',
  completed text[] not null default '{}',
  blackboard jsonb not null default '{}',
  status text not null default 'running',     -- running | done | failed
  updated_at timestamptz not null default now()
);
alter table agent_runs enable row level security;  -- service-role only (worker)

-- ── tracing: make agent spans (job_events type='span') queryable ────────────────
-- Spans are stored in job_events with gen_ai.* attributes in `data` (OTel-GenAI shaped).
create index if not exists job_events_span_idx on job_events ((data->>'span_id')) where type = 'span';
create index if not exists job_events_trace_idx on job_events (trace_id) where type = 'span';
