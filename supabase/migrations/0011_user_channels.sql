-- 0011: ADR-084 — ek teslim kanalları (Telegram/E-posta/WhatsApp) hesap-düzeyi tercihleri.
-- PII zonu: e-posta/numara/chat_id kişisel veridir → RLS yalnız sahibi; backend service-role.
create table if not exists public.user_channels (
  user_id uuid primary key references auth.users(id) on delete cascade,
  telegram_chat_id text,
  email text,
  whatsapp_to text,
  enabled text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.user_channels enable row level security;
-- Sahibi okur/yazar; service-role (backend) RLS'i bypass eder.
drop policy if exists "own channels" on public.user_channels;
create policy "own channels" on public.user_channels
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
comment on table public.user_channels is 'Hesap-düzeyi ek bildirim kanalı tercihleri (ADR-084); PII.';
