-- ADR-113: kullanıcı-başına AI kişiselleştirme. Kullanıcı kendini tanıtır (ai_about) +
-- ek dikkat/odak notu (ai_attention) yazar; niyet asistanının sistem istemine enjekte
-- edilir. PII zonu → profiles RLS (yalnız sahibi; backend service-role). Boş varsayılan
-- (geriye dönük güvenli; ayar yoksa enjeksiyon yok).
alter table public.profiles add column if not exists ai_about text;
alter table public.profiles add column if not exists ai_attention text;

comment on column public.profiles.ai_about is
  'AI kişiselleştirme (ADR-113): kullanıcının kendini tanıtması; asistan istemine enjekte.';
comment on column public.profiles.ai_attention is
  'AI kişiselleştirme (ADR-113): kullanıcının ek dikkat/odak notu; asistan istemine enjekte.';
