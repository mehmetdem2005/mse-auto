# Whenly — Product Marketing Context

> `product-marketing` skill'inin (coreyhaines31/marketingskills, ADR-096) kanonik
> bağlam dosyası: tüm pazarlama/metin işleri (copywriting, copy-editing) önce
> burayı okur. Kod tabanından otomatik taslaklandı (2026-06-12); kaynaklar:
> apps/website içerikleri, docs/GEO-pazarlama-mimarisi.md, ADR günlüğü.

## 1. Product Overview
- **One-liner:** Whenly watches the public web for the moment you're waiting for and rings your phone when it happens.
- **What it does:** You describe an event in one plain sentence ("tell me when this is back in stock under $500"). Whenly checks public web sources at regular intervals and sends a notification — or a real alarm — when it appears.
- **Category (shelf):** Monitoring & alerts app (web monitoring / "tell me when" tools).
- **Type & model:** SaaS (web + Android). Free plan (3 watches) + Pro subscription (100 watches, more frequent checks, alarm mode).

## 2. Target Audience
- **Who:** Individuals and small businesses waiting for a specific, time-sensitive public event: price drops, restocks, rental listings, ticket on-sales, tenders/RFPs, grant calls, regulation changes, competitor moves, page announcements.
- **Jobs to be done:** (1) Stop manually refreshing pages. (2) Be first when the window opens. (3) Encode a compound condition ("in stock AND under $500") without learning a rule engine.
- **Language:** 11 interface languages; global-first (EN root, TR mirror) — not tied to one country.

## 3. Problems & Pain
- Good listings/restocks/on-sales close within hours; whoever sees them first wins.
- Existing tools are page-based (need a URL) or keyword-digest (Google Alerts) — neither handles "event + threshold" in plain language, and none ring the phone.
- The emotional core: fear of missing the moment after days of waiting.

## 4. Positioning (vs alternatives — honest)
- Visualping/Distill: best for diffing ONE known page. Google Alerts: free keyword digests.
- **Whenly's slot:** "I'm waiting for an EVENT and my phone must ring when it happens" — topic-based (no URL needed), compound conditions from plain language, alarm mode.

## 5. Voice & Claims Discipline (bağlayıcı)
- Sell the solution (time back, the caught moment), not the feature list.
- HONESTY RULES (GEO doc + terms): no fabricated stats/testimonials; never promise second-level alerts; state plainly that only public pages are watched (no logins/captchas); no artificial scarcity/urgency.
- Style: simple > complex, specific > vague, active voice, no exclamation points, no buzzwords ("streamline", "innovative").

## 6. Proof Points (gerçek)
- Free plan with no card; data export & permanent delete; 11 languages; web + Android from one codebase; compound-condition parsing in plain language.
