---
name: whenly-brain
description: Whenly projesinde kodlama/mimari görevlerinde ZORUNLU. Projenin "second brain"ini (ADR karar günlüğü + EA mimari + CLAUDE.md kuralları) kalıcı ajan hafızası olarak yükler; her anlamlı değişiklik bir ADR/EA girdisiyle bu hafızaya yazılır ve çelişen kararlar "supersedes" ile uzlaştırılır (self-rewriting knowledge base). Ayrıca olay-bazlı araştırma/fizibilite/site-izni ajan playbook'unu (deepseek-v4-pro + function-calling) tanımlar. obsidian-mind / obsidian-second-brain / obsidian-skills yöntemlerinden uyarlanmıştır (referans: ~/agent-refs; bunlar Obsidian'a özgüdür, Whenly'de çalışmaz). Her backend/mobil/mimari işe başlamadan tara, iş sonunda ADR/EA güncelle.
---

# Whenly Brain — kalıcı proje hafızası + ajan playbook

Bu skill, ajanı (Claude'u) Whenly için daha yetenekli kılar: oturum-bağımsız **kalıcı hafıza**
(proje kararları + mimari) + tutarlı bir **araştırma/fizibilite ajan yöntemi**. Karpathy'nin
"LLM Wiki" → obsidian-second-brain "self-rewriting knowledge base" fikrinin Whenly'ye uyarlamasıdır.

## A) İkinci beyin (kalıcı hafıza) — HER görevde ÖNCE yükle
Kanonik bilgi (tek kaynak — başka yere kopyalama, buraya yaz):
- `docs/mimari-karar-gunlugu.md` — **ADR** karar günlüğü (NE / NEDEN / DÜRÜST SINIR). En son: ADR-119; sıradaki ADR-120+.
- `docs/EA-TOGAF-mimari.md` — **EA** yetenek tablosu (C-0xx) + ADM + ISO eşlemesi.
- `CLAUDE.md` — proje kuralları (skill zorunlulukları, deploy akışı, gizlilik zonları, ABARTMA YOK).

**Self-rewriting kural** (obsidian-second-brain uyarlaması):
1. Göreve başlarken ilgili ADR/EA girdilerini **tara** — mevcut kararı yeniden üretme; çelişki varsa eskisini `supersedes ADR-xxx` ile **uzlaştır**.
2. Her anlamlı değişikliğin SONUNDA: yeni **ADR** (sınıf: Artımlı / Düzeltici / Yeniden-mimari) + **EA** satırı yaz; "Standartlar" dipnotu ekle.
3. **ABARTMA YOK:** uygulanmayanı "yapıldı" yazma; bilinçli atlananı gerekçesiyle belirt.

## B) Mimari hafıza (hızlı bağlam — ramp-up)
- **Monorepo** (pnpm + turbo): `apps/backend` (Hono, hexagonal: domain port → application → infra adapter → interfaces/http), `apps/mobile` (Expo/RN, nativewind, react-query, i18n ×11), `apps/website` (SSG), `packages/contracts` (zod).
- **LLM:** tek global `LlmModelRouter` (`app_settings['llm.active']`) → `chatWithActive` → deepseek/groq. ADR-119 Groq çapraz-fallback; ADR-118 asistan sezgisel fallback (503 yerine 200). **Model ayrımı (ADR-121+):** asistan/ajan = **deepseek-v4-pro sabit**; watcher reasoner/verifier/e-posta = **admin-seçili model**.
- **İzleme hattı:** scheduler (60s tick) → checker (Serper/Tavily + canlı resmî site `origin.ts`, SSRF korumalı) → reasoner → şüpheci verifier → detection_event → delivery worker → FCM/Telegram/Email(Resend)/WhatsApp.
- **Deploy:** feature branch → `main` merge → Render (backend) + Vercel (mobil-web). **Gizlilik:** PII zonu (profiles, watches.raw_intent, deliveries) vs paylaşılan (canonical_topics, check_runs); RLS, backend service-role. Migration **yalnız açık izinle**.
- **Gate:** `pnpm biome check` + `pnpm turbo run typecheck` + `pnpm turbo run test` yeşil olmalı.

## C) Ajan / araştırma-fizibilite playbook (deepseek-v4-pro + function-calling)
Kullanıcı bir olay anlattıktan SONRA, **olaya özel** (genel değil):
1. **Planla** — hangi arama sorgusu, hangi kaynak önceliği (resmî site / haber / web), kaç tur.
2. **Site-izni** — hedef/authority domain'in `robots.txt` (+ opsiyonel ToS) → izinli mi? robots **tavsiyedir**, hukuki garanti değil → dürüstçe işaretle.
3. **Karar (verdict)** — `can` / `partial` / `cannot`: NEDEN + nasıl yapacağı + izin durumu. Saçma/istek-değil girdi → **reddet** (ADR-119; `looksUnmonitorable` + RULE #2).
4. **Araçlar (function-calling):** `web_search`, `resolve_authority`, `check_site_policy`, `rag_retrieve`.
5. Watcher'ın GERÇEK koşması **admin-seçili modelle**; asistan/ajan kararı **v4-pro** ile.

## Kaynak (referans — `~/agent-refs/`, yalnız YÖNTEM)
DÜRÜST SINIR: bu repolar Obsidian-CLI/kasalarına özgüdür, Whenly (RN/Hono) içinde **çalışmaz**; klonlar yalnız yöntem referansıdır.
- `obsidian-second-brain` → self-rewriting bilgi tabanı → ADR/EA disiplinine uyarlandı.
- `obsidian-mind` → kalıcı ajan hafızası + "Decision Record" şablonu → ADR formatı.
- `obsidian-skills` → agent-skill formatı → bu skill + ajan araç kayıt deseni.

## Bitiş dipnotu
Bu skill devredeyse iş sonunda doğrula: ADR + EA güncellendi mi · "Standartlar" dipnotu yazıldı mı · ABARTMA YOK · gate yeşil mi.
