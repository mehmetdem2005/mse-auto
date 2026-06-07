-- 0013_video_url.sql — persistent storage link for the rendered MP4 (Supabase Storage).
alter table video_jobs add column if not exists video_url text;
