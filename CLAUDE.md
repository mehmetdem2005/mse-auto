# Watcher — Proje Kuralları

## ZORUNLU: Design & Engineering Standards
**Her kodlama/UI işinde** `.claude/skills/design-standards/SKILL.md` skill'indeki standartlara uy:
Atomic Design · Material/HIG/Fluent/Carbon · 8pt grid · App Shell/PRPL/SPA · ITCSS/CUBE/BEM/OOCSS ·
WCAG 2.2 AA + WAI-ARIA + Semantic HTML5 · tek-yönlü state (react-query/zustand) + FSM · Core Web Vitals + RAIL.

- Koda başlamadan skill'in ilgili bölümlerini uygula.
- **Her işin SONUNDA** "**Standartlar**" dipnotu ekle: o işte fiilen uygulanan standartları madde madde yaz.

## Mimari
- **Monorepo (pnpm):** `apps/backend` (Hono, hexagonal), `apps/dashboard` (Vite/React), `apps/mobile` (Expo/expo-router, nativewind), `packages/contracts` (zod).
- Backend: domain port → application → infrastructure (supabase/in-memory) → interfaces/http route; sözleşmeler `@watcher/contracts`.
- Gizlilik zonları: PII (profiles, watches.raw_intent, personal_criteria, deliveries) vs paylaşılan (canonical_topics, check_runs, detection_events). Backend service-role; istemci anon + RLS.

## Geliştirme akışı
- `claude/watcher-free`'de geliştir → **main'e merge** → otomatik deploy (Render backend + GitHub Actions→Vercel: dashboard & mobil-web).
- Commit öncesi `pnpm -r typecheck` + biome temiz olmalı (lefthook pre-commit biome çalıştırır).
- DB migration'ları yalnız **açık kullanıcı izniyle** canlıya uygulanır.
- Mobilin web build'i için web bağımlılıkları **yalnız CI'da** kurulur; native/Android kaynağına yazılmaz.
