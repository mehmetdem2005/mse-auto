# AGENTS — ajan sistemi (v0.5)

## Dürüst karşılaştırma: Kimi'ye göre neredeyiz?

Kimi K2.6'nın **Agent Swarm**'ı modelin **içine, RL ile eğitilmiş** bir yetenektir. Gemini API'sinin
üstüne kurulan hiçbir framework buna **eşit olamaz** — modelin kendi planlama ve araç-yargısı kalitesi
tavandır. Bunu taklit ettiğimizi iddia etmiyoruz. Yaptığımız şey, Kimi'nin **mimari olarak** önemli
özelliklerini API üstünde **uygulama-orkestrasyonlu** kurmaktır.

| Özellik | Kimi K2.6 Agent Swarm | Bu sistem (v0.5) |
|---|---|---|
| Görev ayrıştırma | Dinamik, model-native | ✅ Dinamik (planner LLM bir DAG üretir) |
| Araç kullanan alt-ajanlar | ✅ think→act→observe, model-native | ✅ ReAct döngüsü (uygulama aracı yürütür/doğrular) |
| Paralel alt-ajanlar | ✅ 300'e kadar | ✅ var ama **sınırlı** (varsayılan 3 paralel) |
| Adım ufku | 4.000 koordineli adım, 12+ saat | ◐ **bütçeli** (varsayılan 40 adım) |
| Kendi kendini düzeltme | ✅ model-native replan | ✅ süpervizör retry + revize döngüsü + **replan** (v0.6) |
| Durable checkpoint/resume | ✅ | ✅ **v0.6** (LangGraph tarzı `agent_runs`) |
| Gözlemlenebilirlik/trace | ✅ (LangSmith) | ✅ **v0.6** OTel-GenAI span (`gen_ai.*`) |
| Guardrails | ✅ | ✅ giriş guardrail (v0.6) + ≥5 kurul (çıkış) |
| Araç seti | Açık (tarama, kod, dosya, 24/7) | ◯ **güvenli/dar** (RAG, kaynaklı web araştırma, bellek, pano) |
| Orkestrasyon zekâsı | Ağırlıklarda (RL) | Kod + rol promptları (deterministik, **test edilebilir**) |
| Sonuç sentezi | ✅ | ✅ sentezleyici ajan |
| Kalite denetimi | — | ✅ ≥5 denetçili kurul + veto (bizde fazladan) |

Özet: **bu görev için** (doğrulanmış bir Short üretmek) sistem gerçekten güçlü — dinamik plan,
araç kullanan paralel alt-ajanlar, süpervizör, sentez, sonra ≥5 denetçi. Ama bu, Kimi'nin
genel-amaçlı, uzun-ufuklu, model-native swarm'ı **değildir**. Dürüst olmak gerekirse bizim
avantajımız öngörülebilirlik ve denetlenebilirlik (kararı kod verir, her şey loglanır/test edilir);
Kimi'nin avantajı ham ajan zekâsı ve ufuk.

> Canlı-API notu: Gemini fonksiyon-çağrı döngüsü dokümante edilen şekle göre yazıldı ve orkestrasyon
> mantığı **sahte modelle birim-test edildi** (21/21), ama canlı Gemini araç-döngüsü bu repoda
> çalıştırılmadı. `produceShort()`, swarm hata verirse daha basit kurul hattına **otomatik düşer** —
> hat asla sert kırılmaz.

## Swarm mimarisi (plan → swarm → sentez → kurul)
```
  topic
    │
    ▼
  PLANNER (LLM)  ──►  görev DAG'ı  (örn. facts → angle → outline)   [dinamik ayrıştırma]
    │                         (planner hata → DEFAULT_PLAN)
    ▼
  SWARM (runtime.ts + tools.ts)
    │  bağımsız görevler PARALEL (≤SWARM_MAX_PARALLEL), global adım bütçesi (SWARM_STEP_BUDGET)
    │  her alt-ajan: ReAct döngüsü → rag_search / web_research / read|write_artifact / finish
    │  SÜPERVİZÖR: başarısız görevi ≤SWARM_RETRIES kez yeniden dener; çıktılar PANO'ya (blackboard)
    ▼
  SYNTHESIZER (LLM)  ──►  panodan nihai ShortScript (şema garantili)
    │
    ▼
  REVIEW BOARD (≥5 denetçi + veto) ──►  baş editör kararı + revize döngüsü ──►  insan kapısı
```
Modlar: `AGENT_MODE=swarm` (yukarıdaki tam akış) veya `board` (planner/swarm atlanır, doğrudan
yazar→kurul; daha ucuz/hızlı). Dosyalar: `orchestrator.ts` (plan/runSwarm/synthesize/produceShort),
`runtime.ts` (ReAct ajan + blackboard + bütçe), `tools.ts` (güvenli araçlar), `agents.ts` (kurul).

---

# Denetim kurulu (kalite katmanı) — alt-üst hiyerarşi

Aşağıdaki kurul, swarm çıktısını (veya board modunda yazar çıktısını) denetler.


## Hiyerarşi
```
                 ORKESTRATÖR  (runEditorialPipeline)
                       │  top-down: görevi böl
                       ▼
                 PRODÜKTÖR (scriptwriter)  →  taslak senaryo
                       │
        ┌──────────────┴───────────────────────────────┐
        ▼  PARALEL — DENETİM KURULU (≥5; varsayılan 6)   │
   ┌─────────────┬─────────────┬─────────────┬──────────┴──┬──────────────┐
   │ Doğruluk*   │ Politika*   │ Telif/Hukuk*│ Editöryel   │ Retention    │ Dil
   │ (fact-check │ (YouTube/   │ (copyright/ │ (özgün ses, │ (hook/tempo/ │ (TR dilbilgisi)
   │  + arama)   │  güvenlik)  │  lisans)    │  AI-slop)   │  payoff/CTA) │
   └─────────────┴─────────────┴─────────────┴─────────────┴──────────────┘
        │  her biri yapısal VERDICT döndürür: {pass, score, severity, issues, required_fixes}
        ▼  bottom-up: eskalasyon
                 BAŞ EDİTÖR  (consolidate — saf/deterministik)
                       │
        approve ───────┼─────── blocked (VETO)        revise
            │          │             │                   │  fixes aşağı iner
            │          │             │                   ▼
            │          │             │            DÜZELTİCİ (reviser) → yeni taslak → tekrar kurul
            │          │             │              (MAX_REVISE_ROUNDS'a kadar)
            ▼          ▼             ▼
   (+ deterministik    İNSAN KAPISI (needs_review) — tam rapor ekli
    compliance:        karar: blocked / quorum altı / compliance fail → her zaman insana
    cosine özgünlük,
    cap, ifşa)
            ▼
   requireHumanApproval ? needs_review : approved
```

## VETO kuralı (gerçek sign-off gibi)
`critical` denetçiler tek başına **bloklayabilir**: Doğruluk, Politika, Telif. Biri `pass=false` veya
`severity=critical` derse, diğerleri onaylasa bile karar **blocked** → insana. Diğer denetçiler
(Editöryel, Retention, Dil) quorum'a katkı verir; veto yetkileri yoktur.

## Onay eşiği
`REVIEWER_QUORUM` (varsayılan **5**) kadar `pass` + hiç veto yoksa → **approve**. Altındaysa ve veto
yoksa → **revise** (zorunlu düzeltmeler düzelticiye iner, tekrar denetlenir). `MAX_REVISE_ROUNDS`
(varsayılan 2) bitince hâlâ geçmiyorsa → **insana** (rapor ekli).

## Dayanıklılık
- Bir denetçi çağrısı hata verirse (güvenlik/parse/timeout) → o denetçi **non-pass** sayılır (kurul
  çökmez). `critical` denetçi hatası → critical severity.
- Tüm LLM çağrıları rate limiter + circuit breaker + retry içinde; her çağrının token'ı bütçeye yazılır.
- Güvenlik bloğu (SafetyBlockedError) → konu tekrar denenmez, insana gider.

## Maliyet/süre
Bir video ≈ 1 prodüktör (güçlü model) + her turda 6 denetçi (ucuz model) + ≤2 düzeltme (güçlü) + 1
editör notu. Worst-case ~22 Gemini çağrısı. Ücretsiz katmanda rate limiter bunları ~6 sn aralıkla
sıraya koyar (yavaş ama güvenli); Tier 1'de `RATE_LIMITS_JSON` ile hızlanır. Bütçe cap'i aşılırsa
pipeline otomatik durur.

## Yapılandırma (env)
`REVIEWER_QUORUM` (5), `MAX_REVISE_ROUNDS` (2), `REVIEW_MODEL` (denetçi modeli; vars. flash),
`REVISE_MODEL` (düzeltme modeli; vars. pro). Denetçi rolleri `packages/core/src/agents.ts` içinde
(`REVIEWERS`); rol eklemek/çıkarmak için orayı düzenle.

## Panelde
Onay kartında (`/queue`) her işin **kurul özeti** görünür: karar, skor, `geçen/toplam`, veto, denetçi
rozetleri (✓/✗ + skor), editör notu ve zorunlu düzeltmeler. Rapor `video_jobs.review` (jsonb) +
`review_score` kolonlarında saklanır (migration 0004).

> Not: Bu, modelin içine gömülü bir "swarm" değil; **uygulama-orkestrasyonlu** bir kuruldur — her ajan
> ayrı bir rol promptu + yapısal çıktı, kararı kod verir (deterministik, test edilebilir, denetlenebilir).
> Kimi tarzı tek-modelli swarm'a kıyasla daha öngörülebilir ve izlenebilir.
