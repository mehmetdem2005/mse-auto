# @watcher/backend
Hono + TypeScript (ADR-009). Tactical DDD / Clean katmanları (backend = domain çekirdeği).

```
src/
  domain/         # saf iş modeli + kurallar (Dependency Rule içe)
  application/    # use-case'ler (CreateWatcher, RunTopicCheck, DecideEvent, FanOutDelivery...)
  infrastructure/ # adapter'lar (Supabase, DeepSeek, arama, FCM, queue)
  interfaces/     # HTTP (Hono) + DTO (contracts/Zod)
  config/         # env doğrulama (Zod → fail-fast)
  main.ts         # bootstrap
```

## Çalıştır
```
pnpm install
pnpm -F @watcher/backend dev     # tsx watch
# health: curl http://localhost:3000/health
```
