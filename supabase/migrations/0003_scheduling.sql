-- 0003_scheduling.sql — optional: drive the pipeline from inside Postgres.
-- Research finding: Supabase ships pg_cron (scheduler) + pg_net (HTTP from SQL) + Vault (secrets).
-- This lets you trigger the worker on a schedule WITHOUT an always-on loop — cheaper and
-- observable in Supabase. The worker still does the ffmpeg render (run it as a Render *Web
-- Service* in `serve` mode so this can ping POST /tick).

-- Enable the extensions (safe / idempotent).
create extension if not exists pg_cron;
create extension if not exists pg_net;
-- Vault is preinstalled on Supabase as `supabase_vault`.

-- 1) Store the worker URL + token as secrets (run once; replace the values):
--    select vault.create_secret('https://your-worker.onrender.com/tick', 'worker_tick_url');
--    select vault.create_secret('YOUR_WORKER_TOKEN',                      'worker_token');

-- 2) Schedule a tick every 5 minutes (uncomment after step 1):
--
-- select cron.schedule(
--   'auto-shorts-tick',
--   '*/5 * * * *',
--   $$
--     select net.http_post(
--       url     := (select decrypted_secret from vault.decrypted_secrets where name = 'worker_tick_url'),
--       headers := jsonb_build_object(
--                    'Content-Type', 'application/json',
--                    'x-worker-token', (select decrypted_secret from vault.decrypted_secrets where name = 'worker_token')
--                  ),
--       body    := '{}'::jsonb,
--       timeout_milliseconds := 5000
--     );
--   $$
-- );
--
-- Inspect runs:   select * from cron.job;   select * from cron.job_run_details order by start_time desc limit 20;
-- Unschedule:     select cron.unschedule('auto-shorts-tick');

-- ── Future upgrade: pgmq (Supabase Queues) ──────────────────────────────────────
-- Our queue currently uses video_jobs + FOR UPDATE SKIP LOCKED (see 0002), which is fine for
-- single-user volume. To scale, move the actionable-job handoff onto pgmq, which gives native
-- visibility timeouts (= leasing) and retry semantics:
--   create extension if not exists pgmq;
--   select pgmq.create('shorts_jobs');
--   -- enqueue on stage transitions; workers pgmq.read() with a visibility timeout, then
--   -- pgmq.delete() on success or let it reappear (auto-retry) on failure.
-- Keep video_jobs as the system-of-record; use pgmq only as the work-dispatch channel.
