-- 0008: Konu başına resmî/birincil kaynak (ADR-046).
-- Her konunun resmî kurumu/sitesi BİR KEZ LLM ile çözülür ve cache'lenir;
-- her kontrolde önce bu sitede aranır (kaynak güvenilirliği).
alter table canonical_topics
  add column if not exists authority_domain text,
  add column if not exists authority_resolved boolean not null default false;
