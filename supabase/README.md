# supabase/
Veritabanı şeması ve migration'lar (TOGAF Phase C — Data Architecture).

## Uygula
Supabase CLI ile:
```
supabase db push          # migrations/ → projeye
# veya SQL editöründe migrations/0001_init.sql çalıştır
```

## Zon & RLS modeli
- **PII zon** (profiles, watches, personal_criteria, deliveries, subscriptions, device_tokens, user_feedback): RLS açık, `user_id = auth.uid()` (kendi satırı).
- **Paylaşılan/PII'siz zon** (canonical_topics, check_runs, detection_events): RLS açık, **istemci politikası yok** → yalnız service-role erişir.
- **Backend** service-role ile bağlanır (RLS bypass, pipeline). **İstemci** anon/auth ile (RLS zorunlu).
