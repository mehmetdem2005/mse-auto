# AGENT-RESEARCH — 2026 ajan ekosistemi taraması (ve bizim sisteme yansıması)

İnternetten geniş araştırma. Amaç: büyük ajan framework'lerini ve desenlerini çıkarmak, **dürüstçe**
neyi aldığımızı / neyi almadığımızı işaretlemek. Kaynaklar Haz 2026 itibarıyla.

## 1) Framework manzarası (üretim)
| Framework | Orkestrasyon modeli | Güçlü yanı | Durum 2026 |
|---|---|---|---|
| **LangGraph** | Yönlü graf + koşullu kenarlar | **Checkpointing + time-travel + HITL + audit**, en olgun gözlemlenebilirlik (LangSmith) | Üretim lideri (v0.4) |
| **Claude Agent SDK** | Araç-zinciri + subagent | Hooks, **MCP**, Skills, Memory, native tool use (Claude Code'u çalıştırır) | Hızla yaygınlaştı |
| **OpenAI Agents SDK** | Açık **handoff** | Built-in **tracing + guardrails**, sandbox, **first-class MCP** | Üretim olgunluğu |
| **Google ADK** | Hiyerarşik ajan ağacı | Multimodal, Gemini-optimize, **A2A** ile çapraz-framework | GCP-native, yeni |
| **CrewAI** | Rol-tabanlı "crew" | En hızlı prototip (2-4 saat), A2A eklendi | Orta katman |
| **Microsoft Agent Framework** | Graf + konuşma | AutoGen+Semantic Kernel birleşimi, v1.0 GA (Nis 2026) | AutoGen bakım moduna geçti |
| **LlamaIndex / Pydantic AI / smolagents / Mastra / OpenAgents** | RAG / tip-güvenli / HF / TS / protokol-yerli | niş güçler (OpenAgents: MCP+A2A yerli) | büyüyen |

**Dört orkestrasyon stili** netleşti: graf-tabanlı, rol-tabanlı, handoff-tabanlı, hiyerarşik/konuşma.
Bizim sistem: **orchestrator-workers (hiyerarşik) + parallelization + evaluator-optimizer** karması.

## 2) Anthropic'in "Building Effective Agents" desenleri (kanonik)
Prompt Chaining · Routing · Parallelization · **Orchestrator-Workers** · **Evaluator-Optimizer**.
İlke: en basit çözümle başla, ağır framework yerine **birleştirilebilir desenler**, geri-besleme
döngüleri, **gözlemlenebilirlik**. Antidesenler: monolitik ajan, **aşırı planlama**, **eksik gözlemlenebilirlik**.
→ Bizde: orchestrator-workers (swarm), parallelization (paralel alt-ajanlar), evaluator-optimizer
(kurul + revize döngüsü), routing (ucuz/pahalı model). Aşırı planlamadan kaçınmak için plan 2-5 görevle
sınırlı + DEFAULT_PLAN fallback.

## 3) Protokoller (açıldı — Linux Foundation)
- **MCP (Model Context Protocol):** araç/veri bağlama standardı; her büyük framework yerli/adaptör
  destekliyor; yüzlerce MCP server. → Bizde: `tools.toMcpToolDefs()` ile araçlar MCP tanımına
  eşlenir; tek eksik ince bir MCP server sarmalı.
- **A2A (Agent2Agent):** ajanlar-arası birlikte çalışma. → Bizde: şimdilik tek-süreç; A2A ile dış
  ajanlara açılım gelecekteki yol.

## 4) Gözlemlenebilirlik — OTel GenAI semconv (standart)
LLM/araç/ajan adımları `gen_ai.*` öznitelikli **span**'lere sarılır (operation.name = invoke_agent /
generate_content / execute_tool; request.model; usage.input/output_tokens). İçerik span event'lerinde
(PII'den kaçınmak için), öznitelikte değil. Datadog/Langfuse/Jaeger/Tempo hepsi tüketir.
→ Bizde (**v0.6**): `tracing.ts` job_events'e `gen_ai.*` şekilli span yazar (invoke_agent kökü +
alt-ajan span'leri + generate_content). İnce bir OTel exporter ile dışa aktarılabilir.

## 5) Maliyet/güvenilirlik desenleri
- **Prompt/context caching** (tekrar eden bağlamda %90'a varan tasarruf) — bizde yol haritası (büyük
  sistem promptları + kaynak materyal için Gemini context caching).
- **Multi-model routing** (%30-50 tasarruf) — bizde var (denetçi=flash, yazar/sentez=pro).
- **At-least-once + idempotency, DLQ, görünürlük zaman aşımı** — bizde var (kuyruk katmanı).
- **Checkpointing/resume** — bizde **v0.6** (`agent_runs`).

## 6) Ne aldık / neyi bilinçli almadık (dürüst)
**Aldık (v0.6):** dinamik plan + **replan** (LangGraph esnekliği), araç kullanan ReAct alt-ajanlar,
paralel yürütme + adım bütçesi, süpervizör retry, sentez, **durable checkpoint/resume** (LangGraph
imzası), **OTel-GenAI span izleme** (eksik-gözlemlenebilirlik antidesenine çare), **giriş guardrail'i**
(OpenAI SDK), **MCP-uyumlu araç tanımları**, ≥5 denetçili kurul + veto (evaluator-optimizer'ın ötesi).

**Almadık / sınırlı (neden):**
- **Ağır framework'e geçiş yok** (LangGraph/CrewAI). Neden: Anthropic'in "ağır framework yerine
  birleştirilebilir desen" tavsiyesi + tek-kullanıcı/dar görev; bağımlılık ve karmaşıklık maliyeti.
  Yine de mimari özellikleri (graf/checkpoint/guardrail/trace) kendimiz kurduk.
- **Model-native swarm yok** (Kimi K2.6 gibi). Neden: RL-eğitimli ajan zekâsı API üstünde taklit
  edilemez; model tavandır (bkz. AGENTS.md "Dürüst karşılaştırma").
- **Açık uçlu/uzun-ufuk yok** (4000 adım/12 saat). Bizde adım bütçesi (40) + dar/güvenli araç seti
  (kod çalıştırma/dosya/serbest ağ yok) — kasıtlı güvenlik kararı.
- **A2A çoklu-ajan ağı yok** (tek süreç). Gelecek yol.
- **Gerçek OTel SDK/collector yok** — span'ler dokümante şekle göre job_events'e yazılır; exporter
  ince bir glue olarak eklenir.

## 7) Doğrulama
`npm run test -w @studio/core` → **25/25** (zamanlayıcı, dayanıklılık, rate-limit, kurul, ReAct runtime,
swarm bağımlılık/retry, **replan/resume/checkpoint/span**). Canlı Gemini araç-döngüsü bu repoda
çalıştırılmadı; orkestrasyon mantığı sahte modelle birim-test edildi.

> Sonuç: framework manzarasının **mimari olarak önemli** kısımlarını (graf-akış esnekliği, replan,
> checkpoint/resume, guardrails, OTel-GenAI trace, MCP-uyum) bu göreve uyarladık — ağır bir framework'e
> bağımlı olmadan ve öngörülebilirliği/denetlenebilirliği koruyarak. Tavan hâlâ modelin kendisi.

---

## 8) Kendi-kendini-iyileştiren ajanlar + güvenli otomatik kod değişikliği (v0.7 araştırması)
- **DGM (Darwin Gödel Machine, ICLR 2026):** kendi kodunu yineli değiştirir ve her değişikliği
  **benchmark ile ampirik doğrular** (SWE-bench 20→50%); "net-fayda kanıtlamak pratikte imkânsız" →
  doğrulama şart. **SICA** (Bristol, ~53% SWE-bench), **ShinkaEvolve/OpenEvolve/AlphaEvolve/CodeEvolve**.
  Hepsinde ortak vurgu: **"güvenli yapılırsa"**.
- **Güvenli otomatik kod değişikliği (2026 endüstri/Google pratiği):** **çift kapı** — ajan kendi testini
  koşar, **CI bağımsız ZORUNLU kapı** olarak tekrar koşar ("doğrulama ancak zorunlu kapıyken sonucu
  değiştirir"). Agent PR'ları insan koduyla **aynı branch protection + required status checks**'ten geçer;
  bot status-check atlayacaksa **Rulesets** gerekir. **Hard-fail** test kapıları, **merge queue**,
  **coverage gate**, **revert ile rollback**. Düşük-risk/contained işlerde parlar; muğlak yargı işlerinde
  insan sahiplenir.
- **Bizde (v0.7):** `github.ts` (PR-only, CI-gated, revertable) + `selfimprove.ts` (saf risk sınıflandırma,
  düşük-risk+yeşil+opt-in auto-merge) + `monitor.ts` (geniş sinyal + yorum analizi → fırsatlar) +
  `supervisor.ts` (bellek onarımı + self-heal) + rate-limit "bekle ve aynı istekten devam". **Dürüst:**
  model tavandır; kod-dosyası düzenlemesi opt-in + insan kapısı; canlı GitHub çağrıları mock-test edildi.

---

## 9) Ajan hiyerarşisi + dinamik tool + sandbox + YouTube uzmanlığı (v0.8 araştırması)
- **Topolojiler (2026):** hiyerarşik supervisor (manager→worker), **orchestrator-worker (~%70 üretim)**,
  swarm (peer + shared blackboard). Rol-tabanlı (Planner/Executor/Verifier/Optimizer) + maker-checker.
  Dürüst ekonomi: çoklu-ajan %58–285 token ek yükü — yalnızca uzmanlık/paralellik/kritik fayda varsa.
- **Dinamik tool (OpenSage/Yunjue):** meta-tool ile **çalışma anında tool sentezi** (impl+metadata,
  runtime doğrular+kaydeder); capability-gap'te **Tool-Developer** bespoke tool yapar; izole sandbox + cache.
- **Bellek/güvenlik (AgentSys):** ana ajan trusted uzun-ufuk; worker'lar **güvenilmez tool çıktısını**
  izole işler, **şema-doğrulanmış** değer yukarı akar. Tool'lar **ajan-başına whitelist + politika kapısı**;
  shared memory üzerinden zararlı içerik yayılabilir → girdi izolasyonu.
- **YouTube (2026):** hook ilk **0.5–3 sn** (mute'ta okunur 3–6 kelime), yavaş giriş yok; sinyaller
  **replay/CTR/like-view/share/satisfaction** > watch time; **promise=payoff**; **outlier 3x+** rakip
  analizi (yorum+transkript+metrik); tek-değişkenli A/B; 72sa kurtarma planı; tutarlılık 3–5x/hafta.
- **Bizde (v0.8):** `crew.ts` (manager→uzman roller: trend/rakip/hook/senarist/paketleme/uyum/analist/
  modül-denetçisi/tool-geliştirici/self-improve), `toolregistry.ts` (dinamik kayıt + `synthesizeToolSpec`
  meta-tool + rol-scope), `sandbox.ts` (Shared/Agent sandbox + Cache + kalıcı bellek), `policy.ts`
  (disclosure/daily_cap/originality/child_safety/aaa/safe_pr), `audit.ts` (AAA modül denetimi → split/test),
  `ratelimitprofile.ts` (limit bilgisi + governor → paralellik/aralık), `competitor.ts` (yorum+transkript→
  içgörü), `announce.ts` (otonom işin gerekçesini Türkçe anlatır). Full-auto **toggle** (varsayılan kapalı,
  YouTube kapatma riski uyarısıyla). **Dürüst:** kod-tool/derin değişiklik PR+CI kapısında; model tavandır.

---

## 10) Cerrahi düzenleme + prompt evrimi + otonom anomali kararı + OTel/merge-queue/A2A (v0.9)
- **GEPA (ICLR 2026 Oral):** reflektif prompt evrimi — LLM-yargıç skor + **ASI** (neden başarısız) verir;
  reflektör hedefli yeni prompt önerir; **doğrulama setinde iyileşirse tutulur** (Pareto). RL'den %6–20 iyi,
  35× az rollout. DSPy/Google ADK/MS kullanıyor. → `promptlab.ts` (judge + reflectAndPropose + optimizePrompt).
- **Cerrahi düzenleme (OpenAI apply_patch/Aider):** satır no yok; orijinal/yeni net; **katmanlı eşleşme
  (exact → boşluk-esnek)**; **belirsiz/bulunamadı → reddet** (naive str_replace'in iki ölümcül hatası:
  girinti + çift eşleşme). → `patch.ts` (applyEdits) + `selfimprove.proposeEdits/submitEditPR` (TÜM dosya
  değil, sadece değişen yer).
- **Otonom anomali kararı (Replit dersi):** "kod dondurma" beyanı korkuluk değildir; geniş yetki + tipsiz
  scope + rollback yok = felaket. → `anomaly.ts`: ajan, kodumuzda olmayan durumlara da **akıl yürütür**, ama
  yalnızca **tipli güvenli aksiyon listesinden** seçer (pause/takedown/adjust/open_fix_pr/alert); geri
  alınamaz/yüksek-risk (delete_data/change_infra) **asla otomatik değil** → PR/insan. Operatör mandası
  ("kanal senin, tam yetkin var") + risk katmanı + denetim (incidents) + kill switch. Telif şüphesi →
  videoyu private yapma (geri alınabilir).
- **OTel exporter** (`otel.ts`): gen_ai.* span'leri OTLP/HTTP ile dışa aktarır. **Merge-queue + canary**
  (`mergequeue.ts`): sadece yeşil CI'lı PR'ları sırayla birleştir; regresyonda revert PR. **A2A** (`a2a.ts`):
  agent card + task/message zarfı + yerel dispatcher (ajanlar-arası protokol yüzeyi).
- **Dürüst:** prompt-lab + cerrahi-edit + anomali **modeller sınırında**; canlı çağrılar mock-test (44/44).
  Promptların ajanlara otomatik takılması ve canary'nin tam çapraz-tick döngüsü sıradaki entegrasyon.

---

## 11) Entegrasyon turu — crew üretim hattı + prompt-swap + canary (v1.0)
- **Crew artık canlı üretim yolu** (`AGENT_MODE=crew`, varsayılan): `produceShort` → `produceViaCrew` →
  manager planı → uzman roller (rol-scope'lu araçlar + **otomatik iyileştirilmiş prompt'lar**) → sentez →
  ≥5 kurul. Hata olursa board'a düşer (güvenlik ağı).
- **Prompt auto-swap:** scriptwriter, synthesize ve crew rolleri artık `promptlab.getActivePrompt(name, fallback)`
  ile en iyi saklı prompt'u kullanır (TTL cache + **fail-fast timeout** → üretimi bloklamaz). promptAudit
  iyileştirilmiş prompt'u kaydeder, sonraki turda otomatik devreye girer.
- **Canary otomatik-revert (döngü kapandı):** otonom merge sonrası baseline hata oranı + önceki dosya
  içeriği + izleme penceresi kaydedilir (`canaries`); pencere dolunca hata oranı eşiği aşmışsa **revert PR**
  açılır (`canary.checkCanaries` her özerklik turunda). Rollback artık zorunlu ve otomatik.
- **Sağlamlaştırma:** prompt-arama ve telemetri (`recordUsage`) artık pipeline'ı asla bloklamaz/patlatmaz.
- **Dürüst:** canlı çağrılar mock-test (47/47); crew/canary mantığı sahte bağımlılıklarla doğrulandı.
