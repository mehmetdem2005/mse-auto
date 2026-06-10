-- 0007: Destek katmanı (ADR-044) — sorun bildirimi + canlı destek sohbeti.
-- PII zonu: kullanıcı mesajları kişiseldir; erişim yalnız service-role (backend).
create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null check (kind in ('problem', 'live')),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists support_tickets_status_idx
  on support_tickets (status, created_at desc);
create index if not exists support_tickets_user_idx
  on support_tickets (user_id, created_at desc);

create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets (id) on delete cascade,
  sender text not null check (sender in ('user', 'admin')),
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists support_messages_ticket_idx
  on support_messages (ticket_id, created_at);

-- İstemci doğrudan erişemez (anon'a policy yok); backend service-role ile çalışır.
alter table support_tickets enable row level security;
alter table support_messages enable row level security;
