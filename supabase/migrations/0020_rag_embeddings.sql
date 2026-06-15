-- ADR-143 (M3.1) — RAG bilgi tabanı: pgvector + embeddings tablosu + benzerlik fonksiyonu.
-- Korpus (detection_events / check_runs / site-policy) metni 768-boyutlu vektöre gömülür (ADR-127:
-- Gemini text-embedding-004 native 768; OpenAI text-embedding-3-small dimensions=768) → sağlayıcı
-- değişimi boyut-uyumlu. Tablo PAYLAŞILAN zonda (içerik public-web türevi; PII yok) → yalnız service-role.

create extension if not exists vector;

create table if not exists embeddings (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,                 -- 'detection_event' | 'check_run' | 'site_policy' | …
  source_id text not null,                   -- kaynak satır kimliği
  content text not null,                      -- gömülen metin (rerank/hata ayıklama için saklanır)
  embedding vector(768) not null,
  created_at timestamptz not null default now(),
  unique (source_type, source_id)             -- upsert anahtarı (yeniden-gömme değiştirir)
);

-- Yaklaşık en-yakın-komşu (cosine) — HNSW boş tabloda da kurulur (eğitim gerektirmez).
create index if not exists embeddings_vec_idx on embeddings using hnsw (embedding vector_cosine_ops);
create index if not exists embeddings_source_idx on embeddings (source_type);

-- Yalnız backend (service-role) erişir; politika YOK → anon/authenticated istemci göremez.
alter table embeddings enable row level security;

-- Benzerlik sorgusu (RPC) — cosine mesafesi <=> ; score = 1 - mesafe (1=birebir, 0=alakasız).
create or replace function match_embeddings(
  query_embedding vector(768),
  match_count int default 5,
  filter_source_types text[] default null
) returns table (source_type text, source_id text, content text, score double precision)
language sql stable as $$
  select e.source_type, e.source_id, e.content, 1 - (e.embedding <=> query_embedding) as score
  from embeddings e
  where filter_source_types is null or e.source_type = any(filter_source_types)
  order by e.embedding <=> query_embedding
  limit match_count;
$$;
