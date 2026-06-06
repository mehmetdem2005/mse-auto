-- Auto-Shorts Studio — Supabase schema
-- Run in the Supabase SQL editor (or `supabase db push`). Single-user/private app.
--
-- IMPORTANT: vector dimension (768) must equal EMBED_DIM in your env. gemini-embedding-001
-- supports 768 / 1536 / 3072 (Matryoshka). If you change EMBED_DIM, change vector(N) below.

create extension if not exists vector;
create extension if not exists pgcrypto;

-- ── Channel config (singleton row id=1) ───────────────────────────────────────
create table if not exists config (
  id int primary key default 1,
  timezone text not null default 'Europe/Istanbul',
  "daytimeStartHour" int not null default 9,
  "daytimeEndHour" int not null default 21,
  "maxPerDay" int not null default 2,            -- keep low: quality > volume
  "minSpacingMinutes" int not null default 150,
  seed bigint not null default 1337,
  "requireHumanApproval" boolean not null default true,
  language text not null default 'tr'
);
insert into config (id) values (1) on conflict (id) do nothing;

-- ── RAG knowledge base ────────────────────────────────────────────────────────
create table if not exists knowledge (
  id text primary key,
  topic text not null,
  text text not null,
  source_title text,
  source_url text,
  verified boolean not null default false,
  embedding vector(768),
  created_at timestamptz default now()
);
create index if not exists knowledge_embedding_idx
  on knowledge using hnsw (embedding vector_cosine_ops);

-- ── Long-term memory ──────────────────────────────────────────────────────────
create table if not exists memory (
  id uuid primary key default gen_random_uuid(),
  kind text not null,                  -- preference | fact | performance_insight | used_topic
  content text not null,
  embedding vector(768),
  created_at timestamptz default now()
);
create index if not exists memory_embedding_idx
  on memory using hnsw (embedding vector_cosine_ops);

-- ── Video jobs (the pipeline state machine) ────────────────────────────────────
create table if not exists video_jobs (
  id uuid primary key default gen_random_uuid(),
  stage text not null default 'queued',
  topic text not null,
  script jsonb,
  narration_embedding vector(768),     -- for the originality guard
  audio_path text,
  video_path text,
  scheduled_for timestamptz,
  youtube_video_id text,
  made_with_ai boolean not null default true,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists jobs_stage_idx on video_jobs (stage);
create index if not exists jobs_narr_idx
  on video_jobs using hnsw (narration_embedding vector_cosine_ops);

-- ── Analytics snapshots ─────────────────────────────────────────────────────────
create table if not exists analytics (
  video_id text primary key,
  title text,
  published_at timestamptz,
  views bigint default 0,
  likes bigint default 0,
  comments bigint default 0,
  snapshot_at timestamptz default now()
);

-- ── RPCs used by @studio/core ───────────────────────────────────────────────────

-- top-k verified knowledge chunks by cosine similarity
create or replace function match_knowledge(
  query_embedding vector(768), match_count int default 6, only_verified boolean default true
) returns table (
  id text, topic text, text text, source_title text, source_url text, verified boolean, similarity float
) language sql stable as $$
  select k.id, k.topic, k.text, k.source_title, k.source_url, k.verified,
         1 - (k.embedding <=> query_embedding) as similarity
  from knowledge k
  where k.embedding is not null and (not only_verified or k.verified)
  order by k.embedding <=> query_embedding
  limit match_count;
$$;

-- top-k memory entries by cosine similarity
create or replace function match_memory(
  query_embedding vector(768), match_count int default 8
) returns table (id uuid, kind text, content text, created_at timestamptz, similarity float)
language sql stable as $$
  select m.id, m.kind, m.content, m.created_at,
         1 - (m.embedding <=> query_embedding) as similarity
  from memory m
  where m.embedding is not null
  order by m.embedding <=> query_embedding
  limit match_count;
$$;

-- closest already-finalized narration (originality guard)
create or replace function match_used_scripts(
  query_embedding vector(768), match_count int default 1
) returns table (id uuid, similarity float)
language sql stable as $$
  select j.id, 1 - (j.narration_embedding <=> query_embedding) as similarity
  from video_jobs j
  where j.narration_embedding is not null
    and j.stage in ('scheduled','uploading','published','approved')
  order by j.narration_embedding <=> query_embedding
  limit match_count;
$$;

-- pick a verified topic that hasn't been used yet
create or replace function pick_unused_topic()
returns table (topic text) language sql stable as $$
  select k.topic
  from knowledge k
  where k.verified
    and not exists (
      select 1 from memory m where m.kind = 'used_topic' and m.content = k.topic
    )
  group by k.topic
  order by random()
  limit 1;
$$;
