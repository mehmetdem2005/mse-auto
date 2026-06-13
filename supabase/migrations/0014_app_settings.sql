-- ADR-095: uygulama-geneli ayarlar (ilk kullanım: admin'in seçtiği global LLM modeli).
-- Anahtar/değer JSONB; yalnız backend (service-role) okur/yazar — istemciye kapalı.
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;
-- Bilinçli: hiçbir RLS policy YOK → anon/authenticated erişemez; service-role RLS'i atlar.

comment on table public.app_settings is
  'Uygulama-geneli ayarlar (ADR-095). Yalnız service-role; ör. llm.active = seçili model.';
