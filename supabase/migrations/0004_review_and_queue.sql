-- 0004_review_and_queue.sql — editorial board results + professional queue hygiene.

-- ── editorial review board results (≥5 reviewers + chief-editor decision) ───────
alter table video_jobs add column if not exists review jsonb;
alter table video_jobs add column if not exists review_score int;
create index if not exists jobs_review_score_idx on video_jobs (review_score);

-- ── queue hygiene (professional-queue best practice: bounded growth) ────────────
-- Trim heavy fields from old terminal jobs and delete very old dead-letter rows.
-- Schedule via pg_cron (see 0003) e.g. daily:  select cleanup_old_jobs(30);
create or replace function cleanup_old_jobs(retain_days int default 30)
returns int language plpgsql as $$
declare n int;
begin
  -- free space: drop large blobs/embeddings on long-published jobs (keep the row + ids)
  update video_jobs
     set narration_embedding = null, video_path = null, audio_path = null
   where stage = 'published' and updated_at < now() - make_interval(days => retain_days)
     and (narration_embedding is not null or video_path is not null);
  get diagnostics n = row_count;
  -- purge ancient dead-letter rows (already alerted on)
  delete from video_jobs where stage = 'dead_letter' and updated_at < now() - make_interval(days => retain_days * 2);
  -- trim the event trail
  delete from job_events where created_at < now() - make_interval(days => retain_days);
  return n;
end $$;

-- ── fast queue-depth snapshot for the dashboard /status ─────────────────────────
create or replace function queue_depth()
returns table(stage text, n bigint) language sql stable as $$
  select stage, count(*)::bigint from video_jobs group by stage order by stage;
$$;
