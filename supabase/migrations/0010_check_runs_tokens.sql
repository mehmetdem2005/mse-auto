-- 0010: ADR-077/A3 — kontrol başına LLM token maliyeti izi.
-- Ek (additive), nullable; eski kayıtlar etkilenmez.
alter table public.check_runs
  add column if not exists tokens_used integer;
comment on column public.check_runs.tokens_used is
  'Kontrolün toplam LLM token maliyeti (reasoner + eskalasyon + doğrulayıcı); ADR-077.';
