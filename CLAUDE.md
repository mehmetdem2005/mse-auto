# Watcher — Proje Kuralları

## ZORUNLU: Design & Engineering Standards
**Her UI işinde DÖRT skill birlikte uygulanır:** `design-standards` + `web-design-advanced`
(görsel hiyerarşi/tipografi/**EMOJİ-İKON YASAĞI** — lucide vektör ikon) + `ui-ux-advanced`
(progressive disclosure/mikro-etkileşim/4-durum kuralı) + `motion-design` (reanimated
kalıpları + reduce-motion; **"animasyon yok" = iş bitmemiş**).
**Her kodlama/UI işinde** `.claude/skills/design-standards/SKILL.md` skill'indeki standartlara uy:
Atomic Design · Material/HIG/Fluent/Carbon · 8pt grid · App Shell/PRPL/SPA · ITCSS/CUBE/BEM/OOCSS ·
WCAG 2.2 AA + WAI-ARIA + Semantic HTML5 · tek-yönlü state (react-query/zustand) + FSM · Core Web Vitals + RAIL ·
TOGAF (TAM/zorunlu: her işte ADM taraması + P1–P9 conformance + değişiklik sınıfı + ADR + EA güncelle) ·
ISO (TAM/zorunlu: 42010 view · 25010 kalite+NFR · 25012 veri · 27001/27002 güvenlik · 29148 gereksinim · 9241 etkileşim).
Kanonik dokümanlar: `docs/EA-TOGAF-mimari.md` (ADM+Requirements Mgmt) · `docs/mimari-karar-gunlugu.md` (ADR).

- Koda başlamadan skill'in ilgili bölümlerini uygula.
- **Her işin SONUNDA** "**Standartlar**" dipnotu ekle: o işte fiilen uygulanan standartları madde madde yaz.

### Otomatik zorlama (hafıza değil, harness çalıştırır)
- **`.claude/settings.json` hook'ları:** `UserPromptSubmit` her prompt'a standart checklist'i enjekte eder (`.claude/standards-reminder.txt`) — context özetlense bile unutulmaz; `Stop` kapısı (`.claude/hooks/standards-gate.sh`) tur biterken biome (a11y/lint/format) temiz değilse **bitirmeyi engeller** (exit 2).
- **Lint a11y zorunlu:** `packages/config/biome.json`'da a11y kuralları error; pre-commit (lefthook) + CI + Stop hook üç katmanda dener.
- **Makinece denetlenemeyen** (TOGAF P1–P9, ISO, Atomic, react-query): hatırlatıcı + bu dosya + footer disipliniyle; bilinçli atlanan gerekçesiyle yazılır, "yapıldı" diye ABARTILMAZ.

## Mimari
- **Monorepo (pnpm):** `apps/backend` (Hono, hexagonal), `apps/mobile` (Expo/expo-router, nativewind — **tek/asıl ürün; Android + mobil-web aynı koddan**), `apps/website` (tanıtım sitesi — sıfır-bağımlılık SSG; GEO/pazarlama stratejisi `docs/GEO-pazarlama-mimarisi.md`, ADR-090), `packages/contracts` (zod). (Dashboard kaldırıldı; admin dahil her şey mobil uygulamada — ADR-032.)
- Backend: domain port → application → infrastructure (supabase/in-memory) → interfaces/http route; sözleşmeler `@watcher/contracts`.
- Gizlilik zonları: PII (profiles, watches.raw_intent, personal_criteria, deliveries) vs paylaşılan (canonical_topics, check_runs, detection_events). Backend service-role; istemci anon + RLS.

## Geliştirme akışı
- `claude/watcher-free`'de geliştir → **main'e merge** → otomatik deploy (Render backend + GitHub Actions→Vercel: mobil-web). Android: `eas build -p android` (aynı RN kodu).
- Commit öncesi `pnpm -r typecheck` + biome temiz olmalı (lefthook pre-commit biome çalıştırır).
- DB migration'ları yalnız **açık kullanıcı izniyle** canlıya uygulanır.
- Mobilin web build'i için web bağımlılıkları **yalnız CI'da** kurulur; native/Android kaynağına yazılmaz.
