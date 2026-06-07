-- 0014_heal_count.sql — bound the auto-heal retries per job (self-recovery).
alter table video_jobs add column if not exists heal_count int not null default 0;
