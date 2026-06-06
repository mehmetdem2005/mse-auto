# STANDARDS.md — Ajan & Mimari Uygunluk Sözleşmesi
> Bu dosya **her turda okunur**, sistem buna göre denetlenir; eksik varsa derin düşünülüp uygulanır.
> Makine-okunur kaynağı: `packages/core/src/standards.ts` (`standards.complianceReport()`), her özerklik turunda loglanır.
> **Dürüstlük etiketi:** `implemented` = kurulu + birim-testli, **henüz canlı çalıştırılmadı**. `partial` = kısmen.
> `documented` = mimaride var, kodda ayrı modül gerekmiyor. `na` = bu proje için kapsam dışı (gerekçesiyle).

## 0) Self-Healing Architecture Loop (verilen şema)
Meta-Level (Controller) → Base-Level (Execution), kapalı döngü. **Bizdeki karşılığı = `runner.ts` özerklik turu:**

| Şema adımı | Bizdeki karşılık | Durum |
|---|---|---|
| Telemetry (App → Introspection) | `otel` (gen_ai span) + `metrics` + `events(job_events)` | ✅ |
| Introspection | `supervisor.superviseOnce` + `monitor` + `auditRepo` | ✅ |
| Analysis | `monitor.findOpportunities` + `anomaly.detectAnomalies` | ✅ |
| Code Gen | `selfimprove.proposeEdits` (cerrahi find/replace) | ✅ |
| Shadow Test | GitHub **CI sert kapısı** + `canary` | 🟡 (gerçek shadow-env sıradaki adım) |
| Validated Patch | `mergequeue` (yalnızca yeşil CI → merge) | ✅ |
| Structural Reflection | PR tabanlı yapı değişikliği (`github`) | ✅ |
| Hot-Swap | **deploy ile soğuk-swap** (kasıtlı) | 🟡 |
| Application Core | worker + pipeline | ✅ |

**Neden in-process hot-swap YOK:** Çalışan süreçte canlı kod değiştirmek (Replit vakası) kontrolsüz felakettir.
Bunun yerine PR→CI→merge→**yeniden dağıtım** ile güvenli soğuk-swap + regresyonda otomatik canary-revert.

## 1) Ajan İletişim & Mesajlaşma
- **FIPA ACL** — ✅ `acl.ts`: performative'ler (inform/request/propose/accept/reject/…), `reply()`.
- **Actor Model** — ✅ `actors.ts`: posta kutulu, aktör-başına **sıralı** işleme → 60+ aktör kilitlenmeden eşzamanlı (in-process; dağıtık Akka/Orleans değil).
- **gRPC / Protobuf** — ⛔ `na`: tek Node uygulaması; tip güvenliği TS + zod + JSON ile sağlanıyor. gRPC yalnızca çok-dilli/dağıtık dağıtım gerekirse.

## 2) Sistem & Kurumsal Mimari
- **TOGAF** — 📄 `documented`: veri/uygulama/teknoloji katmanları belgeli; tam TOGAF süreci tek-kullanıcı için aşırı.
- **ISO/IEC/IEEE 42010** — 📄 `documented`: bakış açıları (operatör/geliştirici/güvenlik) bu dosyada.
- **BDI** — ✅ `bdi.ts`: beliefs/desires/intentions + `deliberate()`.

## 3) İzolasyon & Güvenli Yürütme
- **Hexagonal (Ports/Adapters)** — 📄 `documented`: `gemini`/`youtube`/`supabase`/`github` tipli adaptörler; **canlı kod-yürütücü yok** (üretilen kod runtime'da değil, PR/CI'da).
- **OCI Containers** — ✅ `apps/worker/Dockerfile` (Render konteyneri, ffmpeg dahil).
- **Zero Trust** — ✅ `authz.ts` (varsayılan-reddet yetenek kapısı) + HMAC worker auth + Supabase RLS. Her ayrıcalıklı aksiyon açık yetki ister.

## 4) Görev Dağıtımı & Düşünce Çerçeveleri
- **Blackboard** — ✅ `runtime.ts` (ortak pano).
- **ReAct** — ✅ `runtime.ts` (reason→act→observe).
- **Contract Net Protocol** — ✅ `contractnet.ts` (anons→teklif→en iyi teklife atama).
- **Raft / Paxos** — ⛔ `na`: tek worker; `claim_next_job` + lease güvenli tek-tüketici sağlar. Çok-düğümlü uzlaşı gerekmez.

## 5) Simülasyon & Mekansal Zekâ — (oyun-AI; bu pipeline'a değil, **Godot oyununa** ait)
- **GOAP** — ⛔ `na`: NPC planlama; burada LLM-planner/crew var. Godot oyununa uygulanabilir.
- **Behavior Trees** — ⛔ `na`: oyun tepkiselliği; orkestrasyonu crew+ReAct karşılıyor. Godot oyununa uygulanabilir.
- **Spatial Partitioning (Octree/BVH)** — ⛔ `na`: içerik pipeline'ında 3B uzay yok. Godot oyununa ait.

## 6) Bilişsel Mimari & Hafıza
- **SOAR / ACT-R katmanları** — 📄 `documented`: working=`blackboard`, episodic=`events`/`incidents`, semantic=`rag` (vektör). Fiziksel olarak ayrık.
- **OWL Ontology** — ⛔ `na`: tam bilgi-grafiği aşırı; tek-kanal kapsamında RAG + etiketler yeterli.

## 7) İzlenebilirlik & Dayanıklılık
- **OpenTelemetry** — ✅ `otel.ts` (OTLP/HTTP exporter, gen_ai span).
- **Dead Letter Queue** — ✅ `reliability` + `0002` migration (`dead_letter`).

---
### Doğrulama
- `npm run test -w @studio/core` → **53/53** (yeni: acl/actor×60/cnp/bdi/zero-trust/matris).
- `standards.complianceReport()` her özerklik turunda loglanır; `gaps` = `partial` olanlar (shadow-test, hot-swap).
- **Açık eksikler (dürüst):** gerçek shadow-env çalıştırma; ve sistemin tümü **henüz canlı API'larla koşulmadı**.

---
## 8) v1.2 — eski "kapsam dışı" işaretlediklerimi gerçekten kurdum
Önceki turda fazla kolay elemiştim; araştırıp bu sisteme uyarlayarak **kod + testle** kurdum (hepsi 59/59 testte):
| Standart | Önce | Şimdi | Modül | Dürüst not |
|---|---|---|---|---|
| **GOAP** | ⛔ na | ✅ | `goap.ts` | STRIPS-türevi A* planlayıcı; pipeline'ı planlar (`AGENT_MODE=goap`). |
| **Behavior Trees** | ⛔ na | ✅ | `behaviortree.ts` | tick tabanlı (sequence/selector/parallel/decorator); LLM ajan orkestrasyonu için. |
| **Spatial Partitioning** | ⛔ na | ✅ | `spatial.ts` | kd-tree NN — embedding'ler üzerinde özgünlük/dedup/kümeleme (768-dim üretim için pgvector). |
| **Raft / Paxos** | ⛔ na | ✅ | `leader.ts` | DB TTL-lease lider seçimi (N worker'da tek güvenli lider); özerklik artık lider-kapılı. |
| **OWL / Knowledge Graph** | ⛔ na | ✅ | `ontology.ts` | sorgulanabilir S-P-O triple store; tam OWL/DL akıl yürütücü kapsam dışı. |
| **gRPC / Protobuf** | ⛔ na | 🟡 | `proto/agent.proto` + `contract.ts` | gerçek Protobuf IDL + zod tip-güvenli kontrat; grpc-js wire transport dağıtık adımda. |

**Neden bazıları hâlâ 🟡/uyarlı:** tam teorem-kanıtlama (nöro-sembolik), in-process hot-swap, çalışan grpc sunucusu ve 768-dim'de saf kd-tree — ya güvensiz ya ölçeğe uygun değil; her birinin pratik, dürüst karşılığını koydum. Oyun-AI değil; ajan-sistemi olarak uygulandı.
