-- MSE Auto — Supabase Veritabanı Şeması
-- Supabase SQL Editor'da çalıştırın

-- Araçlar
create table if not exists cars (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  brand text,
  model text,
  year int,
  km text,
  fuel text,
  transmission text,
  color text,
  price text,
  description text,
  features text[],
  images text[],
  documents jsonb default '[]',
  has3d boolean default false,
  featured boolean default false,
  status text default 'active' check (status in ('active','sold','draft')),
  created_at timestamptz default now()
);

-- Değerleme talepleri
create table if not exists valuation_requests (
  id uuid primary key default gen_random_uuid(),
  brand text, model text, year int, km text,
  color text, fuel text, transmission text, condition text,
  description text, contact text not null, phone text not null,
  email text, city text,
  photos text[],
  status text default 'new' check (status in ('new','reviewing','completed','cancelled')),
  notes text,
  created_at timestamptz default now()
);

-- İletişim mesajları
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text, phone text,
  subject text, message text not null,
  status text default 'new' check (status in ('new','read','replied')),
  created_at timestamptz default now()
);

-- Site içeriği (anahtar-değer)
create table if not exists site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- AI yapılandırması
create table if not exists ai_config (
  id int primary key default 1,
  features jsonb default '{}',
  knowledge jsonb default '[]',
  updated_at timestamptz default now()
);

-- RLS politikaları (public okuma)
alter table cars enable row level security;
create policy "Cars public read" on cars for select using (status = 'active');

alter table valuation_requests enable row level security;
create policy "Insert valuation" on valuation_requests for insert with check (true);

alter table contact_messages enable row level security;
create policy "Insert message" on contact_messages for insert with check (true);

alter table site_content enable row level security;
create policy "Content public read" on site_content for select using (true);

alter table ai_config enable row level security;
create policy "AI config public read" on ai_config for select using (true);

-- ── Gemini RAG: Araç Embeddings ──────────────────────────────────────────
-- pgvector eklentisini etkinleştir (Supabase'de varsayılan olarak mevcut)
create extension if not exists vector;

-- Araç embedding tablosu
create table if not exists car_embeddings (
  id        uuid primary key default gen_random_uuid(),
  car_id    text not null unique,
  text      text not null,
  embedding vector(768),  -- Gemini text-embedding-004 boyutu
  created_at timestamptz default now()
);

-- Benzerlik arama fonksiyonu (RAG için)
create or replace function match_cars(
  query_embedding vector(768),
  match_count     int default 3
)
returns table (
  car_id text,
  text   text,
  similarity float
)
language sql stable
as $$
  select
    car_id,
    text,
    1 - (embedding <=> query_embedding) as similarity
  from car_embeddings
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- RLS
alter table car_embeddings enable row level security;
create policy "Embeddings public read" on car_embeddings for select using (true);
create policy "Embeddings insert" on car_embeddings for insert with check (true);
create policy "Embeddings upsert" on car_embeddings for update using (true);
