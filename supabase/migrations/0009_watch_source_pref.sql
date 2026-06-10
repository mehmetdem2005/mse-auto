-- 0009: Watcher kaynak tercihi (ADR-050) — sihirbaz "Kaynak" adımı gerçek olur.
-- auto: motor varsayılanı (canlı>resmî>haber) · news: haber öncelikli ·
-- official: yalnız resmî öncelik · web: genel web öncelikli.
alter table watches
  add column if not exists source_pref text not null default 'auto'
    check (source_pref in ('auto', 'news', 'official', 'web'));
